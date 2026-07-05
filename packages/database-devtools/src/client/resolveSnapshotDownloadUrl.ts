import {
  buildDeviceSnapshotUrl,
  DEVICE_SNAPSHOT_API_PATH,
  wsUrlToHttpUrl,
} from '../types/protocol';

export type ResolveSnapshotDownloadUrlOptions = {
  /**
   * When true, returns a same-origin relative path (e.g. `/api/devices/:id/snapshot`).
   * Use with a dev-server proxy so the browser avoids cross-origin fetches.
   */
  useSameOriginApi?: boolean;
};

export function resolveSnapshotDownloadUrl(
  hubWsUrl: string,
  deviceId: string,
  options: ResolveSnapshotDownloadUrlOptions = {},
): string {
  const path = `${DEVICE_SNAPSHOT_API_PATH}/${encodeURIComponent(deviceId)}/snapshot`;

  if (options.useSameOriginApi) {
    return path;
  }

  return buildDeviceSnapshotUrl(wsUrlToHttpUrl(hubWsUrl), deviceId);
}
