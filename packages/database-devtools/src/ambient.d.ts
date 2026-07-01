declare module '@database-devtools/inspector-sqlite' {
  export function registerSqliteInspector(options?: {
    wasmUrl?: string;
    locateWasm?: () => string;
  }): void;
  export function configureSqliteWasm(locator: () => string): void;
}
