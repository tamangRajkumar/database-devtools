import { registerSqliteAdapter } from '../adapters/sqlite/register';

export async function registerBuiltInAdapters(): Promise<void> {
  registerSqliteAdapter();
}
