import { afterEach, describe, expect, it } from 'vitest';
import {
  loadOrCreateDeviceId,
  PERSISTED_DEVICE_ID_STORAGE_KEY,
  resetMemoryDeviceIdForTests,
} from './persistDeviceId';

afterEach(() => {
  resetMemoryDeviceIdForTests();
});

describe('loadOrCreateDeviceId', () => {
  it('returns a stable id from memory when storage is unavailable', async () => {
    const first = await loadOrCreateDeviceId(null);
    const second = await loadOrCreateDeviceId(null);

    expect(first).toBe(second);
    expect(first.startsWith('device-')).toBe(true);
  });

  it('reuses a stored id and creates one when missing', async () => {
    const values = new Map<string, string>();

    const storage = {
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        values.set(key, value);
      },
    };

    const created = await loadOrCreateDeviceId(storage);
    expect(created.startsWith('device-')).toBe(true);
    expect(values.get(PERSISTED_DEVICE_ID_STORAGE_KEY)).toBe(created);

    const loaded = await loadOrCreateDeviceId(storage);
    expect(loaded).toBe(created);
  });
});
