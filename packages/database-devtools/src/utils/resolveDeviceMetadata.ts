import { Platform } from 'react-native';
import type { DeviceMetadata } from '../types/protocol';

type ExpoConstants = {
  expoConfig?: {
    name?: string;
    version?: string;
    ios?: { bundleIdentifier?: string };
    android?: { package?: string };
  };
};

function getExpoConstants(): ExpoConstants | undefined {
  try {
    const mod = require('expo-constants') as { default?: ExpoConstants };
    return mod.default;
  } catch {
    return undefined;
  }
}

export function resolveDeviceMetadata(): DeviceMetadata {
  const constants = getExpoConstants();
  const config = constants?.expoConfig;

  const metadata: DeviceMetadata = {
    platform: Platform.OS,
    appName: config?.name ?? 'React Native App',
  };

  if (config?.version) {
    metadata.appVersion = config.version;
  }

  const bundleId = config?.ios?.bundleIdentifier ?? config?.android?.package;

  if (bundleId) {
    metadata.bundleId = bundleId;
  }

  return metadata;
}
