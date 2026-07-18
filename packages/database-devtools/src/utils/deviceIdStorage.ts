export type DeviceIdStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

/** Web / Node fallback — device IDs remain stable for the current session. */
export function getDeviceIdStorage(): DeviceIdStorage | null {
  return null;
}
