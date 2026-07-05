import { describe, expect, it, beforeEach } from 'vitest';
import { AdapterResolutionError } from './errors';
import { getAdapterRegistry, resetAdapterRegistry } from './registry';
import { resolveAdapter } from './resolveAdapter';
import type { DatabaseAdapter } from '../types/adapter';

function createMockAdapter(kind = 'mock'): DatabaseAdapter {
  return {
    kind,
    dialect: kind,
    id: 'mock-id',
    name: 'Mock',
    capabilities: {
      exportSnapshot: true,
      executeQuery: false,
      listTables: false,
      getSchema: false,
      transactionalWrites: false,
      observeChanges: false,
      importSnapshot: false,
    },
    exportSnapshot: async () => ({
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: 'application/octet-stream',
      kind,
    }),
  };
}

describe('resolveAdapter', () => {
  beforeEach(() => {
    resetAdapterRegistry();
  });

  it('returns explicit adapter when provided', async () => {
    const adapter = createMockAdapter();
    const resolved = await resolveAdapter({}, { adapter });
    expect(resolved).toBe(adapter);
  });

  it('resolves by explicit type', async () => {
    getAdapterRegistry().register({
      kind: 'sqlite',
      displayName: 'SQLite',
      priority: 100,
      detect: () => false,
      create: () => createMockAdapter('sqlite'),
    });

    const resolved = await resolveAdapter({ any: true }, { type: 'sqlite' });
    expect(resolved.kind).toBe('sqlite');
  });

  it('auto-detects registered adapters', async () => {
    const db = { marker: 'test-db' };

    getAdapterRegistry().register({
      kind: 'custom',
      displayName: 'Custom',
      priority: 50,
      detect: (value) => typeof value === 'object' && value !== null && 'marker' in value,
      create: () => createMockAdapter('custom'),
    });

    const resolved = await resolveAdapter(db);
    expect(resolved.kind).toBe('custom');
  });

  it('throws AdapterResolutionError when detection fails', async () => {
    getAdapterRegistry().register({
      kind: 'sqlite',
      displayName: 'SQLite',
      priority: 100,
      detect: () => false,
      create: () => createMockAdapter('sqlite'),
    });

    await expect(resolveAdapter({ unknown: true })).rejects.toBeInstanceOf(AdapterResolutionError);
  });

  it('throws when database is missing and no adapter override', async () => {
    await expect(resolveAdapter(undefined)).rejects.toBeInstanceOf(AdapterResolutionError);
  });

  it('suggests type override when no detector matches', async () => {
    getAdapterRegistry().register({
      kind: 'sqlite',
      displayName: 'SQLite',
      priority: 100,
      detect: () => false,
      create: () => createMockAdapter('sqlite'),
    });

    try {
      await resolveAdapter({ foo: 'bar' });
      expect.fail('expected error');
    } catch (error) {
      expect(error).toBeInstanceOf(AdapterResolutionError);
      expect((error as AdapterResolutionError).hint).toBe('type');
      expect(String(error)).toContain('type="sqlite"');
    }
  });
});
