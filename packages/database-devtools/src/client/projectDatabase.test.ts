import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchProjectDatabaseMeta } from './projectDatabase';

describe('fetchProjectDatabaseMeta', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns metadata from the hub API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          exists: true,
          relativePath: 'databases/active.db',
          databaseName: 'active.db',
          size: 42,
        }),
      }),
    );

    await expect(fetchProjectDatabaseMeta('http://localhost:3847')).resolves.toMatchObject({
      exists: true,
      databaseName: 'active.db',
    });
  });

  it('throws when the hub responds with an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }),
    );

    await expect(fetchProjectDatabaseMeta('http://localhost:3847')).rejects.toThrow(
      'Failed to fetch project database metadata',
    );
  });
});
