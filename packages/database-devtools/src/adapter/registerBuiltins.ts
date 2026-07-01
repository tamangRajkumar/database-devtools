let builtInsRegistered = false;

type SqliteRegisterModule = {
  registerSqliteAdapter: () => void;
};

export async function registerBuiltInAdapters(): Promise<void> {
  if (builtInsRegistered) {
    return;
  }

  builtInsRegistered = true;

  try {
    const sqlite = (await import('@database-devtools/sqlite')) as SqliteRegisterModule;
    sqlite.registerSqliteAdapter();
  } catch {
    // Optional adapter package is not installed.
  }
}

export function markBuiltInAdaptersRegistered(): void {
  builtInsRegistered = true;
}
