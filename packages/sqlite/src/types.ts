/** Minimal expo-sqlite surface used by the adapter. */
export type ExpoSqliteDatabase = {
  readonly databasePath: string;
  execAsync(sql: string): Promise<void>;
  serializeAsync(databaseName?: string): Promise<Uint8Array>;
};
