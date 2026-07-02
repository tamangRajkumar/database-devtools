import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SQLITE_SNAPSHOT_MIME_TYPE } from '../types/snapshot';
import {
  deviceLatestRelativePath,
  ensureProjectDirectories,
  isPersistenceEnabled,
  loadProjectConfig,
  readManifest,
  resolveActiveDatabasePath,
  resolveDataDir,
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

    const config = await loadProjectConfig(this.dataDir);
    const deviceRelativePath = deviceLatestRelativePath(input.deviceId);
    const deviceAbsolutePath = path.join(this.dataDir, deviceRelativePath);
    const exportedAt = Date.now();

    await mkdir(path.dirname(deviceAbsolutePath), { recursive: true });
    await writeFile(deviceAbsolutePath, input.bytes);

    let activeRelativePath: string | undefined;

    if (config.deviceSync?.promoteLatestToActive !== false) {
      const activeAbsolutePath = resolveActiveDatabasePath(this.dataDir, config);
      activeRelativePath = path.relative(this.dataDir, activeAbsolutePath).replace(/\\/g, '/');

      await mkdir(path.dirname(activeAbsolutePath), { recursive: true });
      await copyFile(deviceAbsolutePath, activeAbsolutePath);
    }

    const manifest = await readManifest(this.dataDir);

    const deviceEntry: DatabaseManifestEntry = {
      id: `device:${input.deviceId}`,
      label: input.databaseName ?? `Device ${input.deviceId}`,
      relativePath: deviceRelativePath.replace(/\\/g, '/'),
      source: 'device',
      deviceId: input.deviceId,
      kind: input.kind,
      mimeType: input.mimeType,
      databaseName: input.databaseName,
      size: input.bytes.byteLength,
      updatedAt: exportedAt,
    };

    let nextManifest = upsertManifestEntry(manifest, deviceEntry);

    if (activeRelativePath) {
      const activeEntry: DatabaseManifestEntry = {
        id: 'active',
        label: input.databaseName ?? 'active.db',
        relativePath: activeRelativePath,
        source: 'active',
        deviceId: input.deviceId,
        kind: input.kind,
        mimeType: input.mimeType,
        databaseName: input.databaseName,
        size: input.bytes.byteLength,
        updatedAt: exportedAt,
      };

      nextManifest = upsertManifestEntry(nextManifest, activeEntry);
    }

    await writeManifest(this.dataDir, nextManifest);

    return {
      deviceRelativePath: deviceRelativePath.replace(/\\/g, '/'),
      activeRelativePath,
      exportedAt,
      size: input.bytes.byteLength,
    };
  }

  async readDeviceSnapshot(deviceId: string): Promise<Buffer | undefined> {
    if (!this.enabled) {
      return undefined;
    }

    const relativePath = deviceLatestRelativePath(deviceId);
    const absolutePath = path.join(this.dataDir, relativePath);

    try {
      return await readFile(absolutePath);
    } catch {
      return undefined;
    }
  }

  async readActiveDatabase(): Promise<Buffer | undefined> {
    if (!this.enabled) {
      return undefined;
    }

    const meta = await this.getActiveDatabaseMeta();

    if (!meta.exists || !meta.absolutePath) {
      return undefined;
    }

    try {
      return await readFile(meta.absolutePath);
    } catch {
      return undefined;
    }
  }

  async getActiveDatabaseMeta(): Promise<ProjectDatabaseMeta> {
    if (!this.enabled) {
      return { exists: false };
    }

    const config = await loadProjectConfig(this.dataDir);
    const absolutePath = resolveActiveDatabasePath(this.dataDir, config);
    const relativePath = path.relative(this.dataDir, absolutePath).replace(/\\/g, '/');

    try {
      const fileStat = await stat(absolutePath);
      const manifest = await readManifest(this.dataDir);
      const entry =
        manifest.entries.find((item) => item.id === 'active') ??
        manifest.entries.find((item) => item.relativePath === relativePath);

      return {
        exists: true,
        relativePath,
        absolutePath,
        kind: entry?.kind ?? 'sqlite',
        mimeType: entry?.mimeType ?? SQLITE_SNAPSHOT_MIME_TYPE,
        databaseName: entry?.databaseName ?? path.basename(absolutePath),
        size: fileStat.size,
        updatedAt: entry?.updatedAt ?? fileStat.mtimeMs,
        source: entry?.source ?? 'active',
        deviceId: entry?.deviceId,
      };
    } catch {
      return { exists: false, relativePath };
    }
  }

  async listDatabases(): Promise<ListedProjectDatabase[]> {
    if (!this.enabled) {
      return [];
    }

    await ensureProjectDirectories(this.dataDir);

    const manifest = await readManifest(this.dataDir);
    const listed = new Map<string, ListedProjectDatabase>();

    for (const entry of manifest.entries) {
      const absolutePath = path.join(this.dataDir, entry.relativePath);

      try {
        const fileStat = await stat(absolutePath);

        listed.set(entry.id, {
          id: entry.id,
          label: entry.label,
          relativePath: entry.relativePath,
          source: entry.source,
          deviceId: entry.deviceId,
          databaseName: entry.databaseName,
          size: fileStat.size,
          updatedAt: entry.updatedAt,
        });
      } catch {
        // Ignore missing files from manifest.
      }
    }

    const { importsDir } = resolveProjectPaths(this.dataDir);

    try {
      const importFiles = await readdir(importsDir);

      for (const fileName of importFiles) {
        if (!fileName.toLowerCase().endsWith('.db')) {
          continue;
        }

        const relativePath = path.join('databases', 'imports', fileName).replace(/\\/g, '/');
        const id = `import:${fileName}`;
        const absolutePath = path.join(importsDir, fileName);
        const fileStat = await stat(absolutePath);

        listed.set(id, {
          id,
          label: fileName,
          relativePath,
          source: 'import',
          databaseName: fileName,
          size: fileStat.size,
          updatedAt: fileStat.mtimeMs,
        });
      }
    } catch {
      // imports directory may not exist yet.
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
