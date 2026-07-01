import type { DatabaseDialect } from './dialect';
import type { WriteOperation } from './write';

/** Database adapter interface for export and future query operations. */
export interface DatabaseAdapter {
  readonly id: string;
  readonly name: string;
  readonly dialect: DatabaseDialect;
  exportSnapshot(): Promise<Uint8Array>;
}

export type WriteResult = {
  rowsAffected: number;
};

/** Adapter that supports transactional writes on the live device database. */
export interface EditableDatabaseAdapter extends DatabaseAdapter {
  beginTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  executeWrite(operation: WriteOperation): Promise<WriteResult>;
}

export function isEditableDatabaseAdapter(
  adapter: DatabaseAdapter | undefined,
): adapter is EditableDatabaseAdapter {
  if (!adapter) {
    return false;
  }

  const candidate = adapter as EditableDatabaseAdapter;
  return (
    typeof candidate.beginTransaction === 'function' &&
    typeof candidate.commitTransaction === 'function' &&
    typeof candidate.rollbackTransaction === 'function' &&
    typeof candidate.executeWrite === 'function'
  );
}
