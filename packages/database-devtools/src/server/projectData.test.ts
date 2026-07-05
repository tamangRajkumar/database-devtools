import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEVICE_EXPORT_FILE_NAME,
  deviceDatabaseFileName,
  deviceDatabaseRelativePath,
  deviceLatestRelativePath,
  deviceStorageRelativePath,
  resolveDataDir,
  resolveDeviceStorageKey,
  sanitizePathSegment,
  upsertManifestEntry,
} from './projectData';

describe('projectData', () => {
  it('sanitizes unsafe path segments', () => {
    expect(sanitizePathSegment('device/with spaces')).toBe('device_with_spaces');
  });

  it('builds per-device database paths', () => {
    expect(deviceDatabaseRelativePath('abc-123')).toBe(
      'databases/devices/abc-123/Database-abc-123.db',
    );
    expect(deviceDatabaseFileName('abc-123')).toBe('Database-abc-123.db');
    expect(deviceLatestRelativePath('abc-123')).toBe('databases/devices/abc-123/latest.db');
  });

  it('builds canonical storage paths from bundle id', () => {
    expect(resolveDeviceStorageKey({ bundleId: 'host.exp.exponent', deviceId: 'device-1' })).toBe(
      'host.exp.exponent',
    );
    expect(deviceStorageRelativePath('host.exp.exponent')).toBe(
      `databases/devices/host.exp.exponent/${DEVICE_EXPORT_FILE_NAME}`,
    );
  });

  it('resolves explicit data directories', () => {
    expect(resolveDataDir('/tmp/devtools')).toBe(path.resolve('/tmp/devtools'));
  });

  it('upserts manifest entries without tracking active.db', () => {
    const next = upsertManifestEntry(
      { version: 1, entries: [] },
      {
        id: 'device:host.exp.exponent',
        label: 'example.db',
        relativePath: 'databases/devices/host.exp.exponent/database.db',
        source: 'device',
        kind: 'sqlite',
        mimeType: 'application/x-sqlite3',
        size: 10,
        updatedAt: 100,
      },
    );

    expect(next.activeDatabase).toBeUndefined();
    expect(next.entries).toHaveLength(1);
  });
});
