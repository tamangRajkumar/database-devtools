export type ExpoSqliteRunResult = {
  changes: number;
};

/** Minimal expo-sqlite surface used by the adapter and mobile inspector. */
export type ExpoSqliteDatabase = {
  readonly databasePath: string;
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: unknown[]): Promise<ExpoSqliteRunResult>;
  serializeAsync(databaseName?: string): Promise<Uint8Array>;
};

export type ExpoSqliteInspectableDatabase = ExpoSqliteDatabase & {
  getAllAsync<T = Record<string, unknown>>(source: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T = Record<string, unknown>>(
    source: string,
    params?: unknown[],
  ): Promise<T | null>;
};
