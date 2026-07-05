import type { RefreshErrorCode } from '../types/protocol';

/** @deprecated Use formatRefreshErrorMessage */
export function formatSyncErrorMessage(code: RefreshErrorCode, message: string): string {
  return formatRefreshErrorMessage(code, message);
}

export function formatRefreshErrorMessage(code: RefreshErrorCode, message: string): string {
  switch (code) {
    case 'DEVICE_OFFLINE':
      return 'Selected device disconnected. Reconnect the mobile app and try again.';
    case 'REFRESH_IN_PROGRESS':
      return 'A refresh is already in progress for this device.';
    case 'EXPORT_FAILED':
      return `Device failed to export or upload snapshot: ${message}`;
    case 'UPLOAD_FAILED':
      return `Snapshot upload failed on the hub: ${message}`;
    case 'TIMEOUT':
      return 'Timed out waiting for the device to upload a snapshot.';
    case 'SNAPSHOT_NOT_FOUND':
      return 'Snapshot expired or was not found. Click Refresh again.';
    case 'INVALID_REQUEST':
      return `Invalid refresh request: ${message}`;
    default:
      return message;
  }
}
