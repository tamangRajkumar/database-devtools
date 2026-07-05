import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchDeviceExportMeta } from './deviceDatabase';

describe('fetchDeviceExportMeta', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns metadata for a device export', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          exists: true,
          deviceId: 'device-1',
          relativePath: 'databases/devices/device-1/Database-device-1.db',
        }),
      }),
    );

    await expect(fetchDeviceExportMeta('http://localhost:3847', 'device-1')).resolves.toMatchObject({
      exists: true,
      deviceId: 'device-1',
    });
  });
});
