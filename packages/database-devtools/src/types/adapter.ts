import type { DatabaseDialect } from './dialect';

/** Database adapter interface for export and future query operations. */
export interface DatabaseAdapter {
  readonly id: string;
  readonly name: string;
  readonly dialect: DatabaseDialect;
  exportSnapshot(): Promise<Uint8Array>;
}
