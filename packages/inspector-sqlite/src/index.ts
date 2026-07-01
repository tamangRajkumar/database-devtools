import { getInspectorRegistry } from 'database-devtools/inspector';
import { configureSqliteWasm } from './sqlModule';
import {
  filterTables,
  isSqliteDatabase,
  sortTables,
  sqliteInspectorDefinition,
  SqliteInspector,
  SqliteSession,
} from './sqliteInspector';

export function registerSqliteInspector(options?: { wasmUrl?: string; locateWasm?: () => string }): void {
  if (options?.locateWasm) {
    configureSqliteWasm(options.locateWasm);
  } else if (options?.wasmUrl) {
    configureSqliteWasm(() => options.wasmUrl!);
  }

  getInspectorRegistry().register(sqliteInspectorDefinition);
}

export {
  SqliteInspector,
  SqliteSession,
  filterTables,
  isSqliteDatabase,
  sortTables,
  sqliteInspectorDefinition,
};
export { configureSqliteWasm } from './sqlModule';

registerSqliteInspector();
