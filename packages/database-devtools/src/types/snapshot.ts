import type { DatabaseKind } from '../types/kind';

export const SNAPSHOT_KIND_HEADER = 'x-database-kind';
export const SNAPSHOT_MIME_HEADER = 'x-snapshot-mime-type';
export const SNAPSHOT_NAME_HEADER = 'x-database-name';

export const SQLITE_SNAPSHOT_MIME_TYPE = 'application/x-sqlite3';

export type SnapshotExport = {
  bytes: Uint8Array;
  mimeType: string;
  kind: DatabaseKind;
  exportedAt?: number;
};
