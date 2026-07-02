import { mkdtemp, readFile, rm } from 'node:fs/promises';
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
  it('persists device snapshots and promotes to active.db', async () => {
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
      deviceRelativePath: 'databases/devices/device-1/latest.db',
      activeRelativePath: 'databases/active.db',
      size: bytes.byteLength,
    });

    const activeBytes = await readFile(path.join(dataDir, 'databases', 'active.db'));
    expect(activeBytes.equals(bytes)).toBe(true);

    const meta = await store.getActiveDatabaseMeta();
    expect(meta.exists).toBe(true);
    expect(meta.databaseName).toBe('booking.db');
    expect(meta.deviceId).toBe('device-1');
  });

  it('reads active database bytes from disk', async () => {
    const dataDir = await createTempDataDir();
    const store = new SnapshotFileStore({ dataDir, enabled: true });
    const bytes = Buffer.from([0, 1, 2, 3]);

    await store.persistDeviceSnapshot({
      deviceId: 'device-2',
      bytes,
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
    });

    const loaded = await store.readActiveDatabase();
    expect(loaded?.equals(bytes)).toBe(true);
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
