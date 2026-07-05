import { readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DEFAULT_DATABASE_RELATIVE_PATH,
  readManifest,
  resolveProjectPaths,
  writeManifest,
  type DatabaseManifest,
  type ProjectDevToolsConfig,
} from './projectData';

const NORMALIZED_CONFIG: ProjectDevToolsConfig = {
  deviceSync: {
    promoteLatestToActive: false,
  },
};

export function stripLegacyActiveManifest(manifest: DatabaseManifest): DatabaseManifest {
  const entries = manifest.entries.filter(
    (entry) =>
      entry.source !== 'active' &&
      entry.id !== 'active' &&
      !entry.id.startsWith('import:'),
  );

  return {
    version: 1,
    entries,
  };
}

export function normalizeProjectConfig(config: ProjectDevToolsConfig): ProjectDevToolsConfig {
  return {
    ...NORMALIZED_CONFIG,
    deviceSync: {
      ...NORMALIZED_CONFIG.deviceSync,
      promoteLatestToActive: false,
    },
  };
}

export async function migrateLegacyActiveDatabase(dataDir: string): Promise<boolean> {
  const { configPath } = resolveProjectPaths(dataDir);
  const manifest = await readManifest(dataDir);
  const stripped = stripLegacyActiveManifest(manifest);
  const activeDbPath = path.join(dataDir, DEFAULT_DATABASE_RELATIVE_PATH);

  let changed =
    stripped.entries.length !== manifest.entries.length || Boolean(manifest.activeDatabase);

  if (changed) {
    await writeManifest(dataDir, stripped);
  }

  try {
    await stat(activeDbPath);
    const hasDeviceExports = stripped.entries.some((entry) => entry.source === 'device');

    if (hasDeviceExports || manifest.entries.some((entry) => entry.source === 'active')) {
      await rm(activeDbPath, { force: true });
      changed = true;
    }
  } catch {
    // active.db not present
  }

  try {
    const raw = await readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw) as ProjectDevToolsConfig;

    if (parsed.defaultDatabase || parsed.deviceSync?.promoteLatestToActive) {
      await writeFile(
        configPath,
        `${JSON.stringify(normalizeProjectConfig(parsed), null, 2)}\n`,
        'utf8',
      );
      changed = true;
    }
  } catch {
    // config will be created on next export
  }

  const importsDir = path.join(dataDir, 'databases', 'imports');

  try {
    await stat(importsDir);
    await rm(importsDir, { recursive: true, force: true });
    changed = true;
  } catch {
    // imports directory not present
  }

  return changed;
}
