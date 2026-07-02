import { wsUrlToHttpUrl } from '../types/protocol';

/**
 * React Native fetch does not support `new Blob([ArrayBuffer])`.
 * Pass the Uint8Array directly as the request body.
 */
export function createSnapshotUploadBody(bytes: Uint8Array): Uint8Array {
  return bytes;
}

/**
 * The hub advertises snapshot URLs using its bind address (often localhost).
 * Mobile clients reach the hub via a different host (10.0.2.2, LAN IP, etc.).
 * Rewrite the upload URL to match the WebSocket hub URL the device already uses.
 */
export function resolveSnapshotUploadUrl(uploadUrl: string, hubWsUrl: string): string {
  const hubHttpBase = wsUrlToHttpUrl(hubWsUrl);
  const target = new URL(uploadUrl);
  const hub = new URL(hubHttpBase.endsWith('/') ? hubHttpBase : `${hubHttpBase}/`);

  target.protocol = hub.protocol;
  target.hostname = hub.hostname;
  target.port = hub.port;

  return target.toString();
}

export type UploadSnapshotOptions = {
  kind: string;
  mimeType: string;
  kindHeader: string;
  mimeHeader: string;
  databaseName?: string;
  nameHeader?: string;
};

export async function uploadSnapshot(
  uploadUrl: string,
  bytes: Uint8Array,
  options: UploadSnapshotOptions,
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    [options.kindHeader]: options.kind,
    [options.mimeHeader]: options.mimeType,
  };

  if (options.databaseName && options.nameHeader) {
    headers[options.nameHeader] = options.databaseName;
  }

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers,
    body: createSnapshotUploadBody(bytes) as BodyInit,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
}
