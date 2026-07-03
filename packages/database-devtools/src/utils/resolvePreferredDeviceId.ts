import type { MobileDeviceInfo } from '../types/protocol';

export type DeviceExportRef = {
  deviceId: string;
  bundleId?: string;
};

export type ResolvePreferredDeviceIdInput = {
  selectedDeviceId: string | null;
  mobiles: MobileDeviceInfo[];
  exports: DeviceExportRef[];
};

function findMobileByBundleId(
  mobiles: MobileDeviceInfo[],
  bundleId?: string,
): MobileDeviceInfo | undefined {
  if (!bundleId) {
    return undefined;
  }

  return mobiles.find((mobile) => mobile.metadata?.bundleId === bundleId);
}

export function resolvePreferredDeviceId(input: ResolvePreferredDeviceIdInput): string | null {
  const connectedIds = new Set(input.mobiles.map((device) => device.deviceId));
  const exportById = new Map(input.exports.map((entry) => [entry.deviceId, entry]));

  if (input.selectedDeviceId) {
    if (connectedIds.has(input.selectedDeviceId)) {
      return input.selectedDeviceId;
    }

    const selectedExport = exportById.get(input.selectedDeviceId);

    if (selectedExport) {
      const bundleMatch = findMobileByBundleId(input.mobiles, selectedExport.bundleId);

      if (bundleMatch) {
        return bundleMatch.deviceId;
      }

      if (input.mobiles.length === 1) {
        return input.mobiles[0]!.deviceId;
      }

      return input.selectedDeviceId;
    }
  }

  return input.mobiles[0]?.deviceId ?? input.exports[0]?.deviceId ?? null;
}

export function resolveLiveSwitchTarget(input: {
  selectedDeviceId: string | null;
  mobiles: MobileDeviceInfo[];
  exports: DeviceExportRef[];
}): string | null {
  if (!input.selectedDeviceId || input.mobiles.length === 0) {
    return null;
  }

  if (input.mobiles.some((mobile) => mobile.deviceId === input.selectedDeviceId)) {
    return null;
  }

  const selectedExport = input.exports.find((entry) => entry.deviceId === input.selectedDeviceId);
  const bundleMatch = findMobileByBundleId(input.mobiles, selectedExport?.bundleId);

  if (bundleMatch) {
    return bundleMatch.deviceId;
  }

  return input.mobiles[0]?.deviceId ?? null;
}
