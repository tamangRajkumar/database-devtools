import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  deviceLatestRelativePath,
  resolveDataDir,
  sanitizePathSegment,
  upsertManifestEntry,
} from './projectData';

describe('projectData', () => {
  it('sanitizes unsafe path segments', () => {
    expect(sanitizePathSegment('device/with spaces')).toBe('device_with_spaces');
  });

  it('builds device latest relative paths', () => {
    expect(deviceLatestRelativePath('abc-123')).toBe('databases/devices/abc-123/latest.db');
  });

  it('resolves explicit data directories', () => {
    expect(resolveDataDir('/tmp/devtools')).toBe(path.resolve('/tmp/devtools'));
  });

  it('upserts manifest entries and tracks active database', () => {
    const next = upsertManifestEntry(
      { version: 1, entries: [] },
      {
        id: 'active',
        label: 'active.db',
        relativePath: 'databases/active.db',
        source: 'active',
        kind: 'sqlite',
        mimeType: 'application/x-sqlite3',
        size: 10,
        updatedAt: 100,
      },
    );

    expect(next.activeDatabase).toBe('databases/active.db');
    expect(next.entries).toHaveLength(1);
  });
});
