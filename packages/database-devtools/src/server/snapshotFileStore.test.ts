import { mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { SnapshotFileStore } from './snapshotFileStore';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })));
});

async function createTempDataDir(): Promise<string> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'devtools-data-'));
  tempDirs.push(dir);
  return dir;
}

describe('SnapshotFileStore', () => {
  it('persists device snapshots to database.db without active.db', async () => {
    const dataDir = await createTempDataDir();
    const store = new SnapshotFileStore({ dataDir, enabled: true });
    const bytes = Buffer.from('sqlite-bytes');

    const result = await store.persistDeviceSnapshot({
      deviceId: 'device-1',
      bytes,
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
      databaseName: 'booking.db',
    });

    expect(result).toMatchObject({
      deviceRelativePath: 'databases/devices/device-1/database.db',
      size: bytes.byteLength,
    });

    const deviceBytes = await readFile(
      path.join(dataDir, 'databases', 'devices', 'device-1', 'database.db'),
    );
    expect(deviceBytes.equals(bytes)).toBe(true);

    const meta = await store.getDeviceDatabaseMeta('device-1');
    expect(meta.exists).toBe(true);
    expect(meta.databaseName).toBe('booking.db');
    expect(meta.deviceId).toBe('device-1');
  });

  it('overrides the same bundle export when the connected device id changes', async () => {
    const dataDir = await createTempDataDir();
    const store = new SnapshotFileStore({ dataDir, enabled: true });
    const first = Buffer.from('first-export');
    const second = Buffer.from('second-export');

    await store.persistDeviceSnapshot({
      deviceId: 'device-old',
      bytes: first,
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
      databaseName: 'devtools-example.db',
      bundleId: 'host.exp.exponent',
    });

    await store.persistDeviceSnapshot({
      deviceId: 'device-new',
      bytes: second,
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
      databaseName: 'devtools-example.db',
      bundleId: 'host.exp.exponent',
    });

    const exports = await store.listDeviceExports();
    expect(exports).toHaveLength(1);
    expect(exports[0]?.deviceId).toBe('device-new');
    expect(exports[0]?.bundleId).toBe('host.exp.exponent');

    const stored = await readFile(
      path.join(dataDir, 'databases', 'devices', 'host.exp.exponent', 'database.db'),
    );
    expect(stored.equals(second)).toBe(true);

    const deviceDirs = await readdir(path.join(dataDir, 'databases', 'devices'));
    expect(deviceDirs).toEqual(['host.exp.exponent']);
  });

  it('reads device database bytes from disk', async () => {
    const dataDir = await createTempDataDir();
    const store = new SnapshotFileStore({ dataDir, enabled: true });
    const bytes = Buffer.from([0, 1, 2, 3]);

    await store.persistDeviceSnapshot({
      deviceId: 'device-2',
      bytes,
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
    });

    const loaded = await store.readDeviceDatabase('device-2');
    expect(loaded?.equals(bytes)).toBe(true);
  });

  it('reads legacy latest.db when new export file is missing', async () => {
    const dataDir = await createTempDataDir();
    const store = new SnapshotFileStore({ dataDir, enabled: true });
    const bytes = Buffer.from('legacy');

    const legacyPath = path.join(dataDir, 'databases', 'devices', 'device-legacy', 'latest.db');
    await mkdir(path.dirname(legacyPath), { recursive: true });
    await writeFile(legacyPath, bytes);

    const loaded = await store.readDeviceDatabase('device-legacy');
    expect(loaded?.equals(bytes)).toBe(true);
  });

  it('reconciles duplicate legacy exports on list', async () => {
    const dataDir = await createTempDataDir();
    const store = new SnapshotFileStore({ dataDir, enabled: true });

    await store.persistDeviceSnapshot({
      deviceId: 'device-a',
      bytes: Buffer.from('a'),
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
      databaseName: 'devtools-example.db',
    });

    await store.persistDeviceSnapshot({
      deviceId: 'device-b',
      bytes: Buffer.from('b'),
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
      databaseName: 'devtools-example.db',
    });

    const exports = await store.listDeviceExports();
    expect(exports).toHaveLength(1);
  });

  it('proxies legacy active database APIs to the newest device export', async () => {
    const dataDir = await createTempDataDir();
    const store = new SnapshotFileStore({ dataDir, enabled: true });
    const bytes = Buffer.from('latest-export');

    await store.persistDeviceSnapshot({
      deviceId: 'device-1',
      bytes,
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
      databaseName: 'example.db',
      bundleId: 'host.exp.exponent',
    });

    const meta = await store.getActiveDatabaseMeta();
    expect(meta.exists).toBe(true);
    expect(meta.deviceId).toBe('device-1');

    const loaded = await store.readActiveDatabase();
    expect(loaded?.equals(bytes)).toBe(true);
  });

  it('does not recreate active.db even when legacy config requests promotion', async () => {
    const dataDir = await createTempDataDir();
    await writeFile(
      path.join(dataDir, 'devtools.json'),
      `${JSON.stringify({
        defaultDatabase: 'databases/active.db',
        deviceSync: { promoteLatestToActive: true },
      }, null, 2)}\n`,
    );

    const store = new SnapshotFileStore({ dataDir, enabled: true });

    await store.persistDeviceSnapshot({
      deviceId: 'device-1',
      bytes: Buffer.from('sqlite'),
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
      bundleId: 'host.exp.exponent',
    });

    await expect(stat(path.join(dataDir, 'databases', 'active.db'))).rejects.toThrow();
  });

  it('returns empty results when persistence is disabled', async () => {
    const dataDir = await createTempDataDir();
    const store = new SnapshotFileStore({ dataDir, enabled: false });

    const result = await store.persistDeviceSnapshot({
      deviceId: 'device-3',
      bytes: Buffer.from('x'),
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
    });

    expect(result).toBeNull();
    expect(await store.readActiveDatabase()).toBeUndefined();
    expect(await store.listDatabases()).toEqual([]);
  });
});
