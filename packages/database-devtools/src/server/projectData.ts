import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const DEFAULT_DATA_DIR = '.devtools';
export const DEFAULT_DATABASE_RELATIVE_PATH = 'databases/active.db';

export type ProjectDevToolsConfig = {
  defaultDatabase?: string;
  deviceSync?: {
    promoteLatestToActive?: boolean;
  };
};

export type DatabaseManifestEntry = {
  id: string;
  label: string;
  relativePath: string;
  source: 'active' | 'device' | 'import';
  deviceId?: string;
  kind: string;
  mimeType: string;
  databaseName?: string;
  size: number;
  updatedAt: number;
};

export type DatabaseManifest = {
  version: 1;
  activeDatabase?: string;
  entries: DatabaseManifestEntry[];
};

export type PersistDeviceSnapshotInput = {
  deviceId: string;
  bytes: Buffer;
  kind: string;
  mimeType: string;
  databaseName?: string;
};

export type PersistDeviceSnapshotResult = {
  deviceRelativePath: string;
  activeRelativePath?: string;
  exportedAt: number;
  size: number;
};

const DEFAULT_CONFIG: ProjectDevToolsConfig = {
  defaultDatabase: DEFAULT_DATABASE_RELATIVE_PATH,
  deviceSync: {
    promoteLatestToActive: true,
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
  const importsDir = path.join(databasesDir, 'imports');
  const devicesDir = path.join(databasesDir, 'devices');
  const configPath = path.join(dataDir, 'devtools.json');
  const manifestPath = path.join(dataDir, 'manifest.json');

  return {
    dataDir,
    databasesDir,
    importsDir,
    devicesDir,
    configPath,
    manifestPath,
  };
}

export async function ensureProjectDirectories(dataDir: string): Promise<void> {
  const paths = resolveProjectPaths(dataDir);

  await mkdir(paths.importsDir, { recursive: true });
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
        ...DEFAULT_CONFIG.deviceSync,
        ...parsed.deviceSync,
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
    ...manifest,
    entries,
    ...(entry.source === 'active' ? { activeDatabase: entry.relativePath } : {}),
  };
}
