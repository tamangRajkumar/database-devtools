import { describe, expect, it, beforeEach } from 'vitest';
import { getAdapterRegistry, resetAdapterRegistry } from './registry';
import type { AdapterDefinition } from './types';

describe('AdapterRegistry', () => {
  beforeEach(() => {
    resetAdapterRegistry();
  });

  it('registers and retrieves definitions by kind', () => {
    const registry = getAdapterRegistry();
    const definition: AdapterDefinition = {
      kind: 'test-db',
      displayName: 'Test DB',
      priority: 10,
      detect: () => true,
      create: () => ({
        kind: 'test-db',
        dialect: 'test-db',
        id: 'test',
        name: 'Test',
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
          bytes: new Uint8Array(),
          mimeType: 'application/octet-stream',
          kind: 'test-db',
        }),
      }),
    };

    registry.register(definition);

    expect(registry.get('test-db')).toBe(definition);
    expect(registry.listSupported()).toEqual([{ kind: 'test-db', displayName: 'Test DB' }]);
  });

  it('picks the highest priority matching detector', () => {
    const registry = getAdapterRegistry();
    const marker = { __kind: 'priority-test' };

    registry.register({
      kind: 'low',
      displayName: 'Low',
      priority: 1,
      detect: () => true,
      create: () => {
        throw new Error('low');
      },
    });

    registry.register({
      kind: 'high',
      displayName: 'High',
      priority: 100,
      detect: () => true,
      create: () => ({
        kind: 'high',
        dialect: 'high',
        id: 'high',
        name: 'High',
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
          bytes: new Uint8Array(),
          mimeType: 'application/octet-stream',
          kind: 'high',
        }),
      }),
    });

    expect(registry.detect(marker)?.kind).toBe('high');
  });
});
