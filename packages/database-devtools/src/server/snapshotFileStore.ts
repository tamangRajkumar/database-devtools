import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SQLITE_SNAPSHOT_MIME_TYPE } from '../types/snapshot';
import {
  dedupeListedDeviceExports,
  findManifestEntryByDeviceId,
  reconcileLegacyManifestEntries,
  removedManifestEntries,
  selectDeviceExportEntriesToPrune,
} from './deviceExportStorage';
import { migrateLegacyActiveDatabase } from './migrateLegacyActiveDb';
import {
  deviceDatabaseRelativePath,
  deviceLatestRelativePath,
  deviceStorageManifestId,
  deviceStorageRelativePath,
  ensureProjectDirectories,
  isPersistenceEnabled,
  readManifest,
  resolveDataDir,
  resolveDeviceStorageKey,
  resolveProjectPaths,
  sanitizePathSegment,
  upsertManifestEntry,
  writeDefaultProjectConfig,
  writeManifest,
  type DatabaseManifestEntry,
  type PersistDeviceSnapshotInput,
  type PersistDeviceSnapshotResult,
} from './projectData';

export type ProjectDatabaseMeta = {
  exists: boolean;
  relativePath?: string;
  absolutePath?: string;
  kind?: string;
  mimeType?: string;
  databaseName?: string;
  size?: number;
  updatedAt?: number;
  source?: DatabaseManifestEntry['source'];
  deviceId?: string;
};

export type ListedProjectDatabase = {
  id: string;
  label: string;
  relativePath: string;
  source: DatabaseManifestEntry['source'];
  deviceId?: string;
  bundleId?: string;
  storageKey?: string;
  databaseName?: string;
  size: number;
  updatedAt: number;
};

export class SnapshotFileStore {
  private readonly dataDir: string;
  private readonly enabled: boolean;

  constructor(options?: { dataDir?: string; enabled?: boolean }) {
    this.dataDir = resolveDataDir(options?.dataDir);
    this.enabled = options?.enabled ?? isPersistenceEnabled();
  }

  getDataDir(): string {
    return this.dataDir;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async persistDeviceSnapshot(
    input: PersistDeviceSnapshotInput,
  ): Promise<PersistDeviceSnapshotResult | null> {
    if (!this.enabled) {
      return null;
    }

    await writeDefaultProjectConfig(this.dataDir);
    await ensureProjectDirectories(this.dataDir);

    const storageKey = resolveDeviceStorageKey({
      bundleId: input.bundleId,
      deviceId: input.deviceId,
    });
    const deviceRelativePath = deviceStorageRelativePath(storageKey);
    const deviceAbsolutePath = path.join(this.dataDir, deviceRelativePath);
    const exportedAt = Date.now();

    await this.pruneDeviceExports({
      keepStorageKey: storageKey,
      keepDeviceId: input.deviceId,
      bundleId: input.bundleId,
      databaseName: input.databaseName,
    });

    await mkdir(path.dirname(deviceAbsolutePath), { recursive: true });
    await writeFile(deviceAbsolutePath, input.bytes);

    const manifest = await readManifest(this.dataDir);

    const deviceEntry: DatabaseManifestEntry = {
      id: deviceStorageManifestId(storageKey),
      label: input.databaseName ?? `Device ${input.deviceId}`,
      relativePath: deviceRelativePath.replace(/\\/g, '/'),
      source: 'device',
      deviceId: input.deviceId,
      bundleId: input.bundleId,
      storageKey,
      kind: input.kind,
      mimeType: input.mimeType,
      databaseName: input.databaseName,
      size: input.bytes.byteLength,
      updatedAt: exportedAt,
    };

    const nextManifest = upsertManifestEntry(manifest, deviceEntry);

    await writeManifest(this.dataDir, nextManifest);

    return {
      deviceRelativePath: deviceRelativePath.replace(/\\/g, '/'),
      exportedAt,
      size: input.bytes.byteLength,
    };
  }

  async reconcileOnMobileConnect(input: {
    deviceId: string;
    bundleId?: string;
  }): Promise<void> {
    if (!this.enabled) {
      return;
    }

    await this.reconcileLegacyExports(input.deviceId);

    const storageKey = resolveDeviceStorageKey({
      bundleId: input.bundleId,
      deviceId: input.deviceId,
    });
    const manifest = await readManifest(this.dataDir);
    const canonicalEntry = manifest.entries.find(
      (entry) => entry.source === 'device' && entry.storageKey === storageKey,
    );

    if (canonicalEntry && canonicalEntry.deviceId !== input.deviceId) {
      const updated = upsertManifestEntry(manifest, {
        ...canonicalEntry,
        deviceId: input.deviceId,
        bundleId: input.bundleId ?? canonicalEntry.bundleId,
        updatedAt: Date.now(),
      });

      await writeManifest(this.dataDir, updated);
    }

    await this.pruneDeviceExports({
      keepStorageKey: storageKey,
      keepDeviceId: input.deviceId,
      bundleId: input.bundleId,
      databaseName: canonicalEntry?.databaseName,
    });
  }

  async readDeviceSnapshot(deviceId: string): Promise<Buffer | undefined> {
    return this.readDeviceDatabase(deviceId);
  }

  async readDeviceDatabase(deviceId: string): Promise<Buffer | undefined> {
    if (!this.enabled) {
      return undefined;
    }

    const resolved = await this.resolveDeviceDatabaseFile(deviceId);

    if (!resolved) {
      return undefined;
    }

    try {
      return await readFile(resolved.absolutePath);
    } catch {
      return undefined;
    }
  }

  async getDeviceDatabaseMeta(deviceId: string): Promise<ProjectDatabaseMeta> {
    if (!this.enabled) {
      return { exists: false, deviceId };
    }

    const resolved = await this.resolveDeviceDatabaseFile(deviceId);

    if (!resolved) {
      return { exists: false, deviceId };
    }

    try {
      const fileStat = await stat(resolved.absolutePath);
      const manifest = await readManifest(this.dataDir);
      const entry = manifest.entries.find(
        (item) => item.deviceId === deviceId && item.source === 'device',
      );

      return {
        exists: true,
        relativePath: resolved.relativePath,
        absolutePath: resolved.absolutePath,
        kind: entry?.kind ?? 'sqlite',
        mimeType: entry?.mimeType ?? SQLITE_SNAPSHOT_MIME_TYPE,
        databaseName: entry?.databaseName ?? path.basename(resolved.absolutePath),
        size: fileStat.size,
        updatedAt: entry?.updatedAt ?? fileStat.mtimeMs,
        source: 'device',
        deviceId,
      };
    } catch {
      return { exists: false, deviceId, relativePath: resolved.relativePath };
    }
  }

  async listDeviceExports(): Promise<ListedProjectDatabase[]> {
    await this.reconcileLegacyExports();
    const databases = await this.listDatabases();
    const deviceExports = databases.filter((entry) => entry.source === 'device' && entry.deviceId);
    return dedupeListedDeviceExports(deviceExports);
  }

  private async reconcileLegacyExports(preferredDeviceId?: string): Promise<void> {
    if (!this.enabled) {
      return;
    }

    await migrateLegacyActiveDatabase(this.dataDir);

    const manifest = await readManifest(this.dataDir);
    const nextEntries = reconcileLegacyManifestEntries({
      entries: manifest.entries,
      preferredDeviceId,
    });

    if (nextEntries.length === manifest.entries.length) {
      const sameOrder = nextEntries.every((entry, index) => entry.id === manifest.entries[index]?.id);

      if (sameOrder) {
        return;
      }
    }

    const removed = removedManifestEntries(manifest.entries, nextEntries);

    for (const entry of removed) {
      await this.deleteEntryFiles(entry);
    }

    await writeManifest(this.dataDir, {
      ...manifest,
      entries: nextEntries,
    });
  }

  private async pruneDeviceExports(input: {
    keepStorageKey: string;
    keepDeviceId: string;
    bundleId?: string;
    databaseName?: string;
  }): Promise<void> {
    const manifest = await readManifest(this.dataDir);
    const removed = selectDeviceExportEntriesToPrune(manifest.entries, input);

    if (removed.length === 0) {
      return;
    }

    for (const entry of removed) {
      await this.deleteEntryFiles(entry);
    }

    const removedIds = new Set(removed.map((entry) => entry.id));

    await writeManifest(this.dataDir, {
      ...manifest,
      entries: manifest.entries.filter((entry) => !removedIds.has(entry.id)),
    });
  }

  private async deleteEntryFiles(entry: DatabaseManifestEntry): Promise<void> {
    const absolutePath = path.join(this.dataDir, entry.relativePath);

    try {
      await rm(absolutePath, { force: true });
    } catch {
      // ignore missing files
    }

    try {
      await rm(path.dirname(absolutePath), { recursive: true, force: true });
    } catch {
      // ignore cleanup failures
    }
  }

  private manifestEntryToListed(entry: DatabaseManifestEntry, fileStat: { size: number }): ListedProjectDatabase {
    return {
      id: entry.id,
      label: entry.label,
      relativePath: entry.relativePath,
      source: entry.source,
      deviceId: entry.deviceId,
      bundleId: entry.bundleId,
      storageKey: entry.storageKey,
      databaseName: entry.databaseName,
      size: fileStat.size,
      updatedAt: entry.updatedAt,
    };
  }

  private async resolveDeviceDatabaseFile(
    deviceId: string,
  ): Promise<{ relativePath: string; absolutePath: string } | undefined> {
    const manifest = await readManifest(this.dataDir);
    const manifestEntry = findManifestEntryByDeviceId(manifest.entries, deviceId);

    if (manifestEntry) {
      const absolutePath = path.join(this.dataDir, manifestEntry.relativePath);

      try {
        await stat(absolutePath);
        return { relativePath: manifestEntry.relativePath, absolutePath };
      } catch {
        // fall through to legacy paths
      }
    }

    const candidates = [
      deviceDatabaseRelativePath(deviceId),
      deviceLatestRelativePath(deviceId),
    ];

    for (const relativePath of candidates) {
      const absolutePath = path.join(this.dataDir, relativePath);

      try {
        await stat(absolutePath);
        return { relativePath, absolutePath };
      } catch {
        // try next candidate
      }
    }

    if (!manifestEntry) {
      return undefined;
    }

    const absolutePath = path.join(this.dataDir, manifestEntry.relativePath);

    try {
      await stat(absolutePath);
      return { relativePath: manifestEntry.relativePath, absolutePath };
    } catch {
      return undefined;
    }
  }

  /** @deprecated Proxies to the newest device export for backward-compatible API callers. */
  async readActiveDatabase(): Promise<Buffer | undefined> {
    if (!this.enabled) {
      return undefined;
    }

    const meta = await this.getActiveDatabaseMeta();

    if (!meta.exists || !meta.deviceId) {
      return undefined;
    }

    return this.readDeviceDatabase(meta.deviceId);
  }

  /** @deprecated Proxies to the newest device export for backward-compatible API callers. */
  async getActiveDatabaseMeta(): Promise<ProjectDatabaseMeta> {
    if (!this.enabled) {
      return { exists: false };
    }

    await migrateLegacyActiveDatabase(this.dataDir);

    const exports = await this.listDeviceExports();
    const latest = exports[0];

    if (!latest?.deviceId) {
      return { exists: false };
    }

    return this.getDeviceDatabaseMeta(latest.deviceId);
  }

  async listDatabases(): Promise<ListedProjectDatabase[]> {
    if (!this.enabled) {
      return [];
    }

    await ensureProjectDirectories(this.dataDir);
    await this.reconcileLegacyExports();

    const manifest = await readManifest(this.dataDir);
    const listed = new Map<string, ListedProjectDatabase>();

    for (const entry of manifest.entries) {
      if (entry.source === 'active' || entry.id.startsWith('import:')) {
        continue;
      }

      const absolutePath = path.join(this.dataDir, entry.relativePath);

      try {
        const fileStat = await stat(absolutePath);

        listed.set(entry.id, this.manifestEntryToListed(entry, fileStat));
      } catch {
        // Ignore missing files from manifest.
      }
    }

    return [...listed.values()].sort((left, right) => right.updatedAt - left.updatedAt);
  }

  async readDatabaseByRelativePath(relativePath: string): Promise<Buffer | undefined> {
    if (!this.enabled) {
      return undefined;
    }

    const normalized = relativePath.replace(/\\/g, '/');
    const absolutePath = path.resolve(this.dataDir, normalized);
    const dataDirResolved = path.resolve(this.dataDir);

    if (!absolutePath.startsWith(dataDirResolved)) {
      return undefined;
    }

    if (!normalized.toLowerCase().endsWith('.db')) {
      return undefined;
    }

    try {
      return await readFile(absolutePath);
    } catch {
      return undefined;
    }
  }

  getDeviceDirectoryName(deviceId: string): string {
    return sanitizePathSegment(deviceId);
  }
}
