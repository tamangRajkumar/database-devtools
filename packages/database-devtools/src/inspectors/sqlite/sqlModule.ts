import initSqlJs, { type SqlJsStatic } from 'sql.js';

let sqlModulePromise: Promise<SqlJsStatic> | null = null;
let wasmLocator: (() => string) | null = null;

export function configureSqliteWasm(locator: () => string): void {
  wasmLocator = locator;
}

export async function getSqlModule(): Promise<SqlJsStatic> {
  if (!sqlModulePromise) {
    sqlModulePromise = initSqlJs({
      // Vite emits /assets/sql-wasm-<hash>.wasm; build-web.mjs also copies /sql-wasm.wasm.
      locateFile: () => wasmLocator?.() ?? '/sql-wasm.wasm',
    });
  }

  return sqlModulePromise;
}
