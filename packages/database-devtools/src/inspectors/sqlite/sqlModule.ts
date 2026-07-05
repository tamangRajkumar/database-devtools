import initSqlJs, { type SqlJsStatic } from 'sql.js';

let sqlModulePromise: Promise<SqlJsStatic> | null = null;
let wasmLocator: (() => string) | null = null;

export function configureSqliteWasm(locator: () => string): void {
  wasmLocator = locator;
}

export async function getSqlModule(): Promise<SqlJsStatic> {
  if (!sqlModulePromise) {
    sqlModulePromise = initSqlJs({
      locateFile: () => wasmLocator?.() ?? '/sql-wasm.wasm',
    });
  }

  return sqlModulePromise;
}
