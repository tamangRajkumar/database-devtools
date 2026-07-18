import AsyncStorage from '@react-native-async-storage/async-storage';
import { afterEach, describe, expect, it } from 'vitest';

import { getDeviceIdStorage } from './deviceIdStorage.native';
import {
  loadOrCreateDeviceId,
  PERSISTED_DEVICE_ID_STORAGE_KEY,
  resetMemoryDeviceIdForTests,
} from './persistDeviceId';

afterEach(async () => {
  await AsyncStorage.clear();
  resetMemoryDeviceIdForTests();
});

describe('getDeviceIdStorage (native)', () => {
  it('returns the statically imported AsyncStorage implementation', () => {
    expect(getDeviceIdStorage()).toBe(AsyncStorage);
  });

  it('persists and reuses the native device id', async () => {
    const storage = getDeviceIdStorage();
    const created = await loadOrCreateDeviceId(storage);

    expect(await AsyncStorage.getItem(PERSISTED_DEVICE_ID_STORAGE_KEY)).toBe(created);

    resetMemoryDeviceIdForTests();
    await expect(loadOrCreateDeviceId(storage)).resolves.toBe(created);
  });
});
