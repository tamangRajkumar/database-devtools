import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DeviceIdStorage } from './deviceIdStorage';

/**
 * Native storage provider. The static import is required so Metro can discover
 * AsyncStorage while access remains deferred until device ID initialization.
 */
export function getDeviceIdStorage(): DeviceIdStorage {
  return AsyncStorage;
}
