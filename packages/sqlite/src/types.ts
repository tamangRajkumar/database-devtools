export type ExpoSqliteRunResult = {
  changes: number;
};

/** Minimal expo-sqlite surface used by the adapter. */
export type ExpoSqliteDatabase = {
  readonly databasePath: string;
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<ExpoSqliteRunResult>;
  serializeAsync(databaseName?: string): Promise<Uint8Array>;
};
