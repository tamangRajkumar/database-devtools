import type { DeviceStatusPayload } from '../types/protocol';

export type DeviceLabel = {
  deviceId: string;
  deviceName: string;
};

export type DeviceLabelFallback = {
  databaseName?: string | null;
  label?: string | null;
};

export function shortenDeviceId(deviceId: string, visibleChars = 4): string {
  if (deviceId.length <= visibleChars * 2 + 1) {
    return deviceId;
  }

  return `${deviceId.slice(0, visibleChars)}…${deviceId.slice(-visibleChars)}`;
}

export function resolveDeviceDisplayName(
  deviceId: string,
  deviceStatus: DeviceStatusPayload | null,
  fallback?: DeviceLabelFallback | null,
): string {
  const mobile = deviceStatus?.mobiles.find((device) => device.deviceId === deviceId);

  if (mobile?.metadata?.appName) {
    return mobile.metadata.appName;
  }

  if (fallback?.databaseName) {
    return fallback.databaseName;
  }

  if (fallback?.label) {
    return fallback.label;
  }

  return 'Device export';
}

export function resolveDeviceLabel(
  deviceId: string,
  deviceStatus: DeviceStatusPayload | null,
  fallback?: DeviceLabelFallback | null,
): DeviceLabel {
  return {
    deviceId,
    deviceName: resolveDeviceDisplayName(deviceId, deviceStatus, fallback),
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
  fallback?: DeviceLabelFallback | null,
): { title: string; message: string } {
  const deviceLabel = resolveDeviceLabel(deviceId, deviceStatus, fallback);

  return {
    title: initiator === 'mobile' ? 'New database received' : 'Database refreshed',
    message: formatSnapshotReceivedMessage(deviceLabel, databaseName),
  };
}
