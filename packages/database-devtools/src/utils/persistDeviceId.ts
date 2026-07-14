import { NativeModules } from 'react-native';

import { generateDeviceId } from './ids';

export const PERSISTED_DEVICE_ID_STORAGE_KEY = '@database-devtools/device-id';

export type DeviceIdStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

/** Optional loader for tests — production uses a lazy require. */
export type AsyncStorageLoader = () => DeviceIdStorage;

let memoryDeviceId: string | null = null;

function hasAsyncStorageNativeModule(): boolean {
  return Boolean(
    NativeModules.RNCAsyncStorage ??
      NativeModules.RNC_AsyncSQLiteDBStoragePassThru ??
      NativeModules.PlatformLocalStorage,
  );
}

function loadAsyncStorageModule(): DeviceIdStorage {
  // Lazy require so AsyncStorage module init cannot crash package import
  // when the native module is null / unlinked.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-async-storage/async-storage') as
    | DeviceIdStorage
    | { default: DeviceIdStorage };
  return 'default' in mod && mod.default ? mod.default : (mod as DeviceIdStorage);
}

export function createAsyncStorageDeviceIdStore(
  loadAsyncStorage: AsyncStorageLoader = loadAsyncStorageModule,
): DeviceIdStorage | null {
  if (!hasAsyncStorageNativeModule()) {
    return null;
  }

  try {
    return loadAsyncStorage();
  } catch {
    return null;
  }
}

function loadOrCreateMemoryDeviceId(): string {
  if (!memoryDeviceId) {
    memoryDeviceId = generateDeviceId();
  }

  return memoryDeviceId;
}

export async function loadOrCreateDeviceId(
  storage: DeviceIdStorage | null = createAsyncStorageDeviceIdStore(),
): Promise<string> {
  if (storage) {
    try {
      const stored = await storage.getItem(PERSISTED_DEVICE_ID_STORAGE_KEY);

      if (stored) {
        return stored;
      }

      const created = generateDeviceId();
      await storage.setItem(PERSISTED_DEVICE_ID_STORAGE_KEY, created);
      return created;
    } catch {
      // Expo Go / missing native module — use an in-memory id for this session.
    }
  }

  return loadOrCreateMemoryDeviceId();
}

/** @internal Test helper */
export function resetMemoryDeviceIdForTests(): void {
  memoryDeviceId = null;
}
