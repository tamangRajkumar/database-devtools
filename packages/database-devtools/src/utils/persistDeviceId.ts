import { generateDeviceId } from './ids';

export const PERSISTED_DEVICE_ID_STORAGE_KEY = '@database-devtools/device-id';

export type DeviceIdStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

let memoryDeviceId: string | null = null;

export function createAsyncStorageDeviceIdStore(): DeviceIdStorage | null {
  try {
    // Optional peer — only available in React Native hosts with AsyncStorage installed.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require('@react-native-async-storage/async-storage').default as DeviceIdStorage;

    return AsyncStorage;
  } catch {
    return null;
  }
}

export async function loadOrCreateDeviceId(
  storage: DeviceIdStorage | null = createAsyncStorageDeviceIdStore(),
): Promise<string> {
  if (storage) {
    const stored = await storage.getItem(PERSISTED_DEVICE_ID_STORAGE_KEY);

    if (stored) {
      return stored;
    }

    const created = generateDeviceId();
    await storage.setItem(PERSISTED_DEVICE_ID_STORAGE_KEY, created);
    return created;
  }

  if (!memoryDeviceId) {
    memoryDeviceId = generateDeviceId();
  }

  return memoryDeviceId;
}

/** @internal Test helper */
export function resetMemoryDeviceIdForTests(): void {
  memoryDeviceId = null;
}
