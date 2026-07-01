import type { AdapterCapabilities } from './capabilities';
import type { DatabaseKind } from './kind';
import type { SnapshotExport } from './snapshot';
import type { WriteOperation } from './write';

/** Database adapter interface for export and write operations on the live device. */
export interface DatabaseAdapter {
  readonly kind: DatabaseKind;
  /** @deprecated Use `kind` instead. */
  readonly dialect: DatabaseKind;
  readonly id: string;
  readonly name: string;
  readonly capabilities: AdapterCapabilities;
  exportSnapshot(): Promise<SnapshotExport>;
}

export type WriteResult = {
  rowsAffected: number;
};

/** Adapter that supports transactional writes on the live device database. */
export interface WritableDatabaseAdapter extends DatabaseAdapter {
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  executeWrite(operation: WriteOperation): Promise<WriteResult>;
}

/** @deprecated Use `WritableDatabaseAdapter` instead. */
export type EditableDatabaseAdapter = WritableDatabaseAdapter;

export function isWritableDatabaseAdapter(
  adapter: DatabaseAdapter | undefined,
): adapter is WritableDatabaseAdapter {
  if (!adapter?.capabilities.transactionalWrites) {
    return false;
  }

  const candidate = adapter as WritableDatabaseAdapter;
  return (
    typeof candidate.beginTransaction === 'function' &&
    typeof candidate.commitTransaction === 'function' &&
    typeof candidate.rollbackTransaction === 'function' &&
    typeof candidate.executeWrite === 'function'
  );
}

/** @deprecated Use `isWritableDatabaseAdapter` instead. */
export const isEditableDatabaseAdapter = isWritableDatabaseAdapter;
