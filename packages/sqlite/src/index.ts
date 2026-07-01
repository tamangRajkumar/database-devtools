export { createExpoSqliteAdapter } from './createExpoSqliteAdapter';
export type { CreateExpoSqliteAdapterOptions } from './createExpoSqliteAdapter';
export { detectExpoSqlite } from './detect';
export { registerSqliteAdapter, sqliteAdapterDefinition } from './register';
export type { ExpoSqliteDatabase } from './types';

import { registerSqliteAdapter } from './register';

registerSqliteAdapter();
