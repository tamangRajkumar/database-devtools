import { describe, expect, it } from 'vitest';
import type { DatabaseManifestEntry } from './projectData';
import {
  dedupeListedDeviceExports,
  reconcileLegacyManifestEntries,
  selectDeviceExportEntriesToPrune,
} from './deviceExportStorage';

function deviceEntry(
  overrides: Partial<DatabaseManifestEntry> & Pick<DatabaseManifestEntry, 'id' | 'deviceId'>,
): DatabaseManifestEntry {
  return {
    label: overrides.label ?? 'devtools-example.db',
    relativePath: overrides.relativePath ?? `databases/devices/${overrides.deviceId}/database.db`,
    source: 'device',
    kind: 'sqlite',
    mimeType: 'application/x-sqlite3',
    databaseName: overrides.databaseName ?? 'devtools-example.db',
    size: overrides.size ?? 10,
    updatedAt: overrides.updatedAt ?? 1,
    ...overrides,
  };
}

describe('selectDeviceExportEntriesToPrune', () => {
  it('removes legacy exports for the same bundle and database name', () => {
    const entries = [
      deviceEntry({
        id: 'device:host.exp.exponent',
        deviceId: 'device-live',
        bundleId: 'host.exp.exponent',
        storageKey: 'host.exp.exponent',
        updatedAt: 300,
      }),
      deviceEntry({
        id: 'device:device-old',
        deviceId: 'device-old',
        databaseName: 'devtools-example.db',
        updatedAt: 100,
      }),
    ];

    const removed = selectDeviceExportEntriesToPrune(entries, {
      keepStorageKey: 'host.exp.exponent',
      keepDeviceId: 'device-live',
      bundleId: 'host.exp.exponent',
      databaseName: 'devtools-example.db',
    });

    expect(removed.map((entry) => entry.id)).toEqual(['device:device-old']);
  });
});

describe('reconcileLegacyManifestEntries', () => {
  it('keeps only the newest export for the same database name', () => {
    const entries = [
      deviceEntry({
        id: 'device:device-a',
        deviceId: 'device-a',
        updatedAt: 100,
      }),
      deviceEntry({
        id: 'device:device-b',
        deviceId: 'device-b',
        updatedAt: 200,
      }),
    ];

    const next = reconcileLegacyManifestEntries({ entries });

    expect(next.filter((entry) => entry.source === 'device')).toHaveLength(1);
    expect(next.find((entry) => entry.source === 'device')?.deviceId).toBe('device-b');
  });
});

describe('dedupeListedDeviceExports', () => {
  it('returns one export per storage key', () => {
    const deduped = dedupeListedDeviceExports([
      {
        id: 'device:host.exp.exponent',
        deviceId: 'device-live',
        bundleId: 'host.exp.exponent',
        storageKey: 'host.exp.exponent',
        updatedAt: 200,
      },
      {
        id: 'device:device-old',
        deviceId: 'device-old',
        databaseName: 'devtools-example.db',
        updatedAt: 100,
      },
    ]);

    expect(deduped).toHaveLength(2);
  });
});
