import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { migrateLegacyActiveDatabase, stripLegacyActiveManifest } from './migrateLegacyActiveDb';
import { readManifest } from './projectData';

const tempDirs: string[] = [];

afterEach(async () => {
  const { rm } = await import('node:fs/promises');
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

async function createTempDataDir(): Promise<string> {
  const { mkdtemp } = await import('node:fs/promises');
  const dir = await mkdtemp(path.join(os.tmpdir(), 'devtools-migrate-'));
  tempDirs.push(dir);
  return dir;
}

describe('migrateLegacyActiveDatabase', () => {
  it('strips active manifest entries and deletes active.db when device exports exist', async () => {
    const dataDir = await createTempDataDir();
    const activePath = path.join(dataDir, 'databases', 'active.db');
    const devicePath = path.join(
      dataDir,
      'databases',
      'devices',
      'host.exp.exponent',
      'database.db',
    );

    await mkdir(path.dirname(activePath), { recursive: true });
    await mkdir(path.dirname(devicePath), { recursive: true });
    await writeFile(activePath, Buffer.from('active'));
    await writeFile(devicePath, Buffer.from('device'));
    await writeFile(
      path.join(dataDir, 'devtools.json'),
      `${JSON.stringify({
        defaultDatabase: 'databases/active.db',
        deviceSync: { promoteLatestToActive: true },
      }, null, 2)}\n`,
    );
    await writeFile(
      path.join(dataDir, 'manifest.json'),
      `${JSON.stringify({
        version: 1,
        activeDatabase: 'databases/active.db',
        entries: [
          {
            id: 'active',
            label: 'active.db',
            relativePath: 'databases/active.db',
            source: 'active',
            kind: 'sqlite',
            mimeType: 'application/x-sqlite3',
            size: 6,
            updatedAt: 1,
          },
          {
            id: 'device:host.exp.exponent',
            label: 'example.db',
            relativePath: 'databases/devices/host.exp.exponent/database.db',
            source: 'device',
            deviceId: 'device-1',
            storageKey: 'host.exp.exponent',
            kind: 'sqlite',
            mimeType: 'application/x-sqlite3',
            size: 6,
            updatedAt: 2,
          },
        ],
      }, null, 2)}\n`,
    );

    const changed = await migrateLegacyActiveDatabase(dataDir);

    expect(changed).toBe(true);
    await expect(stat(activePath)).rejects.toThrow();

    const manifest = await readManifest(dataDir);
    expect(manifest.activeDatabase).toBeUndefined();
    expect(manifest.entries.some((entry) => entry.source === 'active')).toBe(false);

    const config = JSON.parse(await readFile(path.join(dataDir, 'devtools.json'), 'utf8')) as {
      defaultDatabase?: string;
      deviceSync?: { promoteLatestToActive?: boolean };
    };
    expect(config.defaultDatabase).toBeUndefined();
    expect(config.deviceSync?.promoteLatestToActive).toBe(false);
  });

  it('removes legacy import manifest entries and deletes the imports directory', async () => {
    const dataDir = await createTempDataDir();
    const importsDir = path.join(dataDir, 'databases', 'imports');

    await mkdir(importsDir, { recursive: true });
    await writeFile(path.join(importsDir, 'manual.db'), Buffer.from('imported'));
    await writeFile(
      path.join(dataDir, 'manifest.json'),
      `${JSON.stringify({
        version: 1,
        entries: [
          {
            id: 'import:manual.db',
            label: 'manual.db',
            relativePath: 'databases/imports/manual.db',
            source: 'import',
            kind: 'sqlite',
            mimeType: 'application/x-sqlite3',
            size: 8,
            updatedAt: 1,
          },
        ],
      }, null, 2)}\n`,
    );

    const changed = await migrateLegacyActiveDatabase(dataDir);

    expect(changed).toBe(true);
    await expect(stat(importsDir)).rejects.toThrow();

    const manifest = await readManifest(dataDir);
    expect(manifest.entries).toHaveLength(0);
  });
});

describe('stripLegacyActiveManifest', () => {
  it('removes active entries and activeDatabase pointer', () => {
    const next = stripLegacyActiveManifest({
      version: 1,
      activeDatabase: 'databases/active.db',
      entries: [
        {
          id: 'active',
          label: 'active.db',
          relativePath: 'databases/active.db',
          source: 'active',
          kind: 'sqlite',
          mimeType: 'application/x-sqlite3',
          size: 1,
          updatedAt: 1,
        },
      ],
    });

    expect(next.entries).toHaveLength(0);
    expect(next.activeDatabase).toBeUndefined();
  });

  it('removes legacy import entries', () => {
    const next = stripLegacyActiveManifest({
      version: 1,
      entries: [
        {
          id: 'import:manual.db',
          label: 'manual.db',
          relativePath: 'databases/imports/manual.db',
          source: 'device',
          kind: 'sqlite',
          mimeType: 'application/x-sqlite3',
          size: 1,
          updatedAt: 1,
        },
      ],
    });

    expect(next.entries).toHaveLength(0);
  });
});
