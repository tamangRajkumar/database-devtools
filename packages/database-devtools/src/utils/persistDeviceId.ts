import {
  getDeviceIdStorage,
  type DeviceIdStorage,
} from './deviceIdStorage';
import { generateDeviceId } from './ids';

export const PERSISTED_DEVICE_ID_STORAGE_KEY = '@database-devtools/device-id';

export type { DeviceIdStorage };

/** Optional provider for tests; production uses the platform storage module. */
export type AsyncStorageLoader = () => DeviceIdStorage | null;

let memoryDeviceId: string | null = null;

export function createAsyncStorageDeviceIdStore(
  loadAsyncStorage: AsyncStorageLoader = getDeviceIdStorage,
): DeviceIdStorage | null {
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
