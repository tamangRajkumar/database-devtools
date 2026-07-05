import { describe, expect, it, vi } from 'vitest';
import {
  createSnapshotUploadBody,
  resolveSnapshotUploadUrl,
  uploadSnapshot,
} from './snapshotUpload';

describe('createSnapshotUploadBody', () => {
  it('returns Uint8Array without wrapping in Blob', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const body = createSnapshotUploadBody(bytes);

    expect(body).toBe(bytes);
    expect(body).toBeInstanceOf(Uint8Array);
  });
});

describe('resolveSnapshotUploadUrl', () => {
  it('rewrites localhost upload URL to match hub WebSocket host', () => {
    const uploadUrl = resolveSnapshotUploadUrl(
      'http://localhost:3847/api/devices/device-123/snapshot',
      'ws://10.0.2.2:3847/ws',
    );

    expect(uploadUrl).toBe('http://10.0.2.2:3847/api/devices/device-123/snapshot');
  });

  it('rewrites upload URL to LAN IP from hub WebSocket URL', () => {
    const uploadUrl = resolveSnapshotUploadUrl(
      'http://localhost:3847/api/devices/device-abc/snapshot',
      'ws://192.168.1.20:3847/ws',
    );

    expect(uploadUrl).toBe('http://192.168.1.20:3847/api/devices/device-abc/snapshot');
  });
});

describe('uploadSnapshot', () => {
  it('posts Uint8Array body without using Blob', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const bytes = new Uint8Array([9, 8, 7]);

    await uploadSnapshot('http://10.0.2.2:3847/api/devices/test-device/snapshot', bytes, {
      kind: 'sqlite',
      mimeType: 'application/x-sqlite3',
      kindHeader: 'x-database-kind',
      mimeHeader: 'x-snapshot-mime-type',
      databaseName: 'booking.db',
      nameHeader: 'x-database-name',
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(bytes);
    expect(init.body).not.toBeInstanceOf(Blob);
    expect((init.headers as Record<string, string>)['x-database-name']).toBe('booking.db');

    vi.unstubAllGlobals();
  });
});
