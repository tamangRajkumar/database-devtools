import type { DatabaseManifestEntry } from './projectData';
import { deviceStorageManifestId, sanitizePathSegment } from './projectData';

export type ListedDeviceExportLike = {
  id: string;
  deviceId?: string;
  bundleId?: string;
  storageKey?: string;
  databaseName?: string;
  updatedAt: number;
};

export function deriveStorageKeyFromEntry(entry: DatabaseManifestEntry): string {
  if (entry.storageKey) {
    return entry.storageKey;
  }

  if (entry.bundleId) {
    return sanitizePathSegment(entry.bundleId);
  }

  const match = entry.relativePath.match(/databases\/devices\/([^/]+)\//);

  if (match?.[1]) {
    return match[1];
  }

  if (entry.deviceId) {
    return sanitizePathSegment(entry.deviceId);
  }

  return entry.id;
}

export function findManifestEntryByDeviceId(
  entries: DatabaseManifestEntry[],
  deviceId: string,
): DatabaseManifestEntry | undefined {
  return entries.find((entry) => entry.source === 'device' && entry.deviceId === deviceId);
}

export type PruneDeviceExportsInput = {
  keepStorageKey: string;
  keepDeviceId: string;
  bundleId?: string;
  databaseName?: string;
};

export function selectDeviceExportEntriesToPrune(
  entries: DatabaseManifestEntry[],
  keep: PruneDeviceExportsInput,
): DatabaseManifestEntry[] {
  const keepManifestId = deviceStorageManifestId(keep.keepStorageKey);

  return entries.filter((entry) => {
    if (entry.source !== 'device') {
      return false;
    }

    if (entry.id === keepManifestId) {
      return false;
    }

    const entryStorageKey = deriveStorageKeyFromEntry(entry);

    if (entryStorageKey === keep.keepStorageKey) {
      return true;
    }

    if (keep.bundleId && entry.bundleId === keep.bundleId) {
      return true;
    }

    if (
      keep.bundleId &&
      keep.databaseName &&
      !entry.bundleId &&
      entry.databaseName === keep.databaseName
    ) {
      return true;
    }

    if (
      !keep.bundleId &&
      keep.databaseName &&
      entry.databaseName === keep.databaseName &&
      entry.deviceId !== keep.keepDeviceId
    ) {
      return true;
    }

    return false;
  });
}

export function dedupeListedDeviceExports<T extends ListedDeviceExportLike>(entries: T[]): T[] {
  const byStorageKey = new Map<string, T>();

  for (const entry of entries) {
    const storageKey = entry.storageKey
      ? entry.storageKey
      : entry.bundleId
        ? sanitizePathSegment(entry.bundleId)
        : entry.deviceId
          ? sanitizePathSegment(entry.deviceId)
          : entry.id;

    const existing = byStorageKey.get(storageKey);

    if (!existing || entry.updatedAt > existing.updatedAt) {
      byStorageKey.set(storageKey, entry);
    }
  }

  return [...byStorageKey.values()].sort((left, right) => right.updatedAt - left.updatedAt);
}

export type ReconcileLegacyExportsInput = {
  entries: DatabaseManifestEntry[];
  preferredDeviceId?: string;
};

export function reconcileLegacyManifestEntries(
  input: ReconcileLegacyExportsInput,
): DatabaseManifestEntry[] {
  const deviceEntries = input.entries.filter((entry) => entry.source === 'device');
  const otherEntries = input.entries.filter((entry) => entry.source !== 'device');
  const groups = new Map<string, DatabaseManifestEntry[]>();

  for (const entry of deviceEntries) {
    const groupKey = entry.bundleId
      ? `bundle:${entry.bundleId}`
      : entry.databaseName
        ? `db:${entry.databaseName}`
        : `device:${deriveStorageKeyFromEntry(entry)}`;

    const group = groups.get(groupKey) ?? [];
    group.push(entry);
    groups.set(groupKey, group);
  }

  const keptDeviceEntries: DatabaseManifestEntry[] = [];

  for (const group of groups.values()) {
    if (group.length === 1) {
      keptDeviceEntries.push(group[0]!);
      continue;
    }

    const preferred = input.preferredDeviceId
      ? group.find((entry) => entry.deviceId === input.preferredDeviceId)
      : undefined;

    const newest = [...group].sort((left, right) => right.updatedAt - left.updatedAt)[0]!;
    keptDeviceEntries.push(preferred ?? newest);
  }

  return [...otherEntries, ...keptDeviceEntries].sort((left, right) => right.updatedAt - left.updatedAt);
}

export function removedManifestEntries(
  before: DatabaseManifestEntry[],
  after: DatabaseManifestEntry[],
): DatabaseManifestEntry[] {
  const afterIds = new Set(after.map((entry) => entry.id));
  return before.filter((entry) => !afterIds.has(entry.id));
}
