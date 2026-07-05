import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_DATA_DIR = '.devtools';

/** @deprecated Legacy single-database path. Removed — use per-device exports instead. */
export const DEFAULT_DATABASE_RELATIVE_PATH = 'databases/active.db';

export type ProjectDevToolsConfig = {
  /** @deprecated No longer used. */
  defaultDatabase?: string;
  deviceSync?: {
    /** @deprecated Ignored — active.db is no longer written. */
    promoteLatestToActive?: boolean;
  };
};

export type DatabaseManifestEntry = {
  id: string;
  label: string;
  relativePath: string;
  source: 'active' | 'device';
  deviceId?: string;
  bundleId?: string;
  storageKey?: string;
  kind: string;
  mimeType: string;
  databaseName?: string;
  size: number;
  updatedAt: number;
};

export type DatabaseManifest = {
  version: 1;
  /** @deprecated No longer written. */
  activeDatabase?: string;
  entries: DatabaseManifestEntry[];
};

export type PersistDeviceSnapshotInput = {
  deviceId: string;
  bytes: Buffer;
  kind: string;
  mimeType: string;
  databaseName?: string;
  bundleId?: string;
};

export type PersistDeviceSnapshotResult = {
  deviceRelativePath: string;
  exportedAt: number;
  size: number;
};

const DEFAULT_CONFIG: ProjectDevToolsConfig = {
  deviceSync: {
    promoteLatestToActive: false,
  },
};

export function resolveDataDir(explicitDir?: string): string {
  const fromEnv = process.env.DATABASE_DEVTOOLS_DATA_DIR?.trim();

  if (explicitDir?.trim()) {
    return path.resolve(explicitDir.trim());
  }

  if (fromEnv) {
    return path.resolve(fromEnv);
  }

  return path.resolve(process.cwd(), DEFAULT_DATA_DIR);
}

export function isPersistenceEnabled(): boolean {
  const flag = process.env.DATABASE_DEVTOOLS_SNAPSHOT_PERSIST?.trim().toLowerCase();

  if (flag === '0' || flag === 'false' || flag === 'off') {
    return false;
  }

  return true;
}

export function sanitizePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

export function resolveProjectPaths(dataDir: string) {
  const databasesDir = path.join(dataDir, 'databases');
  const devicesDir = path.join(databasesDir, 'devices');
  const configPath = path.join(dataDir, 'devtools.json');
  const manifestPath = path.join(dataDir, 'manifest.json');

  return {
    dataDir,
    databasesDir,
    devicesDir,
    configPath,
    manifestPath,
  };
}

export async function ensureProjectDirectories(dataDir: string): Promise<void> {
  const paths = resolveProjectPaths(dataDir);

  await mkdir(paths.devicesDir, { recursive: true });
}

export async function loadProjectConfig(dataDir: string): Promise<ProjectDevToolsConfig> {
  const { configPath } = resolveProjectPaths(dataDir);

  try {
    const raw = await readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw) as ProjectDevToolsConfig;

    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      deviceSync: {
        promoteLatestToActive: false,
      },
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function writeDefaultProjectConfig(dataDir: string): Promise<void> {
  const { configPath } = resolveProjectPaths(dataDir);

  try {
    await readFile(configPath, 'utf8');
  } catch {
    await mkdir(dataDir, { recursive: true });
    await writeFile(configPath, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`, 'utf8');
  }
}

export function resolveActiveDatabasePath(dataDir: string, config: ProjectDevToolsConfig): string {
  const relative = config.defaultDatabase ?? DEFAULT_DATABASE_RELATIVE_PATH;
  return path.join(dataDir, relative);
}

export function deviceDatabaseFileName(deviceId: string): string {
  return `Database-${sanitizePathSegment(deviceId)}.db`;
}

export const DEVICE_EXPORT_FILE_NAME = 'database.db';

export function resolveDeviceStorageKey(input: { bundleId?: string; deviceId: string }): string {
  const bundleId = input.bundleId?.trim();

  if (bundleId) {
    return sanitizePathSegment(bundleId);
  }

  return sanitizePathSegment(input.deviceId);
}

export function deviceStorageManifestId(storageKey: string): string {
  return `device:${storageKey}`;
}

export function deviceStorageRelativePath(storageKey: string): string {
  return path
    .join('databases', 'devices', storageKey, DEVICE_EXPORT_FILE_NAME)
    .replace(/\\/g, '/');
}

export function deviceDatabaseRelativePath(deviceId: string): string {
  const segment = sanitizePathSegment(deviceId);
  return path
    .join('databases', 'devices', segment, deviceDatabaseFileName(deviceId))
    .replace(/\\/g, '/');
}

/** @deprecated Legacy path — migrated reads still check this location. */
export function deviceLatestRelativePath(deviceId: string): string {
  return path.join('databases', 'devices', sanitizePathSegment(deviceId), 'latest.db').replace(/\\/g, '/');
}

export async function readManifest(dataDir: string): Promise<DatabaseManifest> {
  const { manifestPath } = resolveProjectPaths(dataDir);

  try {
    const raw = await readFile(manifestPath, 'utf8');
    const parsed = JSON.parse(raw) as DatabaseManifest;

    if (parsed.version !== 1 || !Array.isArray(parsed.entries)) {
      return { version: 1, entries: [] };
    }

    return parsed;
  } catch {
    return { version: 1, entries: [] };
  }
}

export async function writeManifest(dataDir: string, manifest: DatabaseManifest): Promise<void> {
  const { manifestPath } = resolveProjectPaths(dataDir);

  await mkdir(dataDir, { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

export function upsertManifestEntry(
  manifest: DatabaseManifest,
  entry: DatabaseManifestEntry,
): DatabaseManifest {
  const entries = manifest.entries.filter((item) => item.id !== entry.id);
  entries.push(entry);

  entries.sort((left, right) => right.updatedAt - left.updatedAt);

  return {
    version: manifest.version,
    entries,
  };
}
