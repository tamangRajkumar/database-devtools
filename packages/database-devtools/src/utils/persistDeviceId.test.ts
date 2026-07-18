import { afterEach, describe, expect, it } from 'vitest';
import {
  createAsyncStorageDeviceIdStore,
  loadOrCreateDeviceId,
  PERSISTED_DEVICE_ID_STORAGE_KEY,
  resetMemoryDeviceIdForTests,
} from './persistDeviceId';

afterEach(() => {
  resetMemoryDeviceIdForTests();
});

describe('createAsyncStorageDeviceIdStore', () => {
  it('returns null from the default Web / Node provider', () => {
    expect(createAsyncStorageDeviceIdStore()).toBeNull();
  });

  it('returns null when the AsyncStorage loader throws', () => {
    const store = createAsyncStorageDeviceIdStore(() => {
      throw new Error('[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.');
    });

    expect(store).toBeNull();
  });

  it('returns the loaded store when native module is present', () => {
    const fakeStore = {
      getItem: async () => null,
      setItem: async () => undefined,
    };

    expect(createAsyncStorageDeviceIdStore(() => fakeStore)).toBe(fakeStore);
  });
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

  it('falls back to memory when storage throws', async () => {
    const storage = {
      getItem: async () => {
        throw new Error('Native module is null');
      },
      setItem: async () => undefined,
    };

    const first = await loadOrCreateDeviceId(storage);
    const second = await loadOrCreateDeviceId(storage);

    expect(first).toBe(second);
    expect(first.startsWith('device-')).toBe(true);
  });

  it('falls back to memory when persisting a new id throws', async () => {
    const storage = {
      getItem: async () => null,
      setItem: async () => {
        throw new Error('Storage write failed');
      },
    };

    const first = await loadOrCreateDeviceId(storage);
    const second = await loadOrCreateDeviceId(storage);

    expect(first).toBe(second);
    expect(first.startsWith('device-')).toBe(true);
  });

  it('falls back to memory when AsyncStorage loader throws at create time', async () => {
    const storage = createAsyncStorageDeviceIdStore(() => {
      throw new Error('[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.');
    });

    const first = await loadOrCreateDeviceId(storage);
    const second = await loadOrCreateDeviceId(storage);

    expect(storage).toBeNull();
    expect(first).toBe(second);
    expect(first.startsWith('device-')).toBe(true);
  });
});
