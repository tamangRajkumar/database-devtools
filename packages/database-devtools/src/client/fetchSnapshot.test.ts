import { describe, expect, it, vi } from 'vitest';
import { fetchSnapshot } from './fetchSnapshot';
import { resolveSnapshotDownloadUrl } from './resolveSnapshotDownloadUrl';

describe('resolveSnapshotDownloadUrl', () => {
  it('builds absolute hub URL by default', () => {
    expect(
      resolveSnapshotDownloadUrl('ws://localhost:3847/ws', 'device-abc'),
    ).toBe('http://localhost:3847/api/devices/device-abc/snapshot');
  });

  it('returns same-origin relative path when requested', () => {
    expect(
      resolveSnapshotDownloadUrl('ws://localhost:3847/ws', 'device-abc', {
        useSameOriginApi: true,
      }),
    ).toBe('/api/devices/device-abc/snapshot');
  });
});

describe('fetchSnapshot', () => {
  it('throws with status details when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }),
    );

    await expect(fetchSnapshot('http://localhost:3847/api/devices/x/snapshot')).rejects.toThrow(
      '404 Not Found',
    );

    vi.unstubAllGlobals();
  });

  it('throws with network context when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(fetchSnapshot('http://localhost:3847/api/devices/x/snapshot')).rejects.toThrow(
      'Network error fetching snapshot',
    );

    vi.unstubAllGlobals();
  });

  it('returns array buffer on success', async () => {
    const bytes = new Uint8Array([1, 2, 3]).buffer;

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => bytes,
      }),
    );

    await expect(fetchSnapshot('http://localhost:3847/api/devices/x/snapshot')).resolves.toBe(bytes);

    vi.unstubAllGlobals();
  });
});
