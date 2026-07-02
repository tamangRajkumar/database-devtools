import type { DeviceStatusPayload } from '../types/protocol';

export type DeviceLabel = {
  deviceId: string;
  deviceName: string;
};

export function shortenDeviceId(deviceId: string, visibleChars = 4): string {
  if (deviceId.length <= visibleChars * 2 + 1) {
    return deviceId;
  }

  return `${deviceId.slice(0, visibleChars)}…${deviceId.slice(-visibleChars)}`;
}

export function resolveDeviceLabel(
  deviceId: string,
  deviceStatus: DeviceStatusPayload | null,
): DeviceLabel {
  const mobile = deviceStatus?.mobiles.find((device) => device.deviceId === deviceId);

  return {
    deviceId,
    deviceName: mobile?.metadata?.appName ?? 'Unknown device',
  };
}

export function formatSnapshotReceivedMessage(
  deviceLabel: DeviceLabel,
  databaseName: string,
): string {
  return `${deviceLabel.deviceName} (${shortenDeviceId(deviceLabel.deviceId)}) · ${databaseName}`;
}

export type SnapshotToastInitiator = 'mobile' | 'browser';

export function buildSnapshotLoadedToast(
  initiator: SnapshotToastInitiator,
  deviceId: string,
  databaseName: string,
  deviceStatus: DeviceStatusPayload | null,
): { title: string; message: string } {
  const deviceLabel = resolveDeviceLabel(deviceId, deviceStatus);

  return {
    title: initiator === 'mobile' ? 'New database received' : 'Database refreshed',
    message: formatSnapshotReceivedMessage(deviceLabel, databaseName),
  };
}
