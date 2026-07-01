import type { DatabaseAdapter } from '../types/adapter';
import type { DatabaseKind } from '../types/kind';

export type AdapterDefinition = {
  kind: DatabaseKind;
  displayName: string;
  priority: number;
  detect: (database: unknown) => boolean;
  create: (database: unknown) => DatabaseAdapter | Promise<DatabaseAdapter>;
};

export type ResolveAdapterOptions = {
  adapter?: DatabaseAdapter;
  type?: DatabaseKind;
};
