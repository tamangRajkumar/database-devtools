import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Host loopback aliases that do not reach the dev machine from Android. */
const ANDROID_LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

/** Special alias from the Android emulator to the host machine. */
export const ANDROID_EMULATOR_HOST = '10.0.2.2';

type ExpoConstantsShape = {
  expoConfig?: { hostUri?: string };
  expoGoConfig?: { debuggerHost?: string };
  manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  manifest?: { debuggerHost?: string };
};

export function isAndroidLoopbackHost(host: string): boolean {
  return ANDROID_LOOPBACK_HOSTS.has(host.toLowerCase());
}

export function readMetroDevHostFromConstants(
  constants: ExpoConstantsShape | undefined,
): string | undefined {
  const hostUri =
    constants?.expoConfig?.hostUri ??
    constants?.expoGoConfig?.debuggerHost ??
    constants?.manifest2?.extra?.expoGo?.debuggerHost ??
    constants?.manifest?.debuggerHost;

  if (typeof hostUri !== 'string' || hostUri.length === 0) {
    return undefined;
  }

  return hostUri.split(':')[0];
}

/**
 * Picks a dev-machine hostname that mobile clients can reach.
 * - Physical devices: Metro debugger host (LAN IP).
 * - Android emulator: 10.0.2.2 when Metro reports loopback.
 * - iOS simulator / default: localhost.
 */
export function resolveDevToolsHostFromInputs(
  platformOs: string,
  metroHost?: string,
): string {
  if (platformOs === 'android') {
    if (metroHost && !isAndroidLoopbackHost(metroHost)) {
      return metroHost;
    }

    return ANDROID_EMULATOR_HOST;
  }

  if (metroHost) {
    return metroHost;
  }

  return 'localhost';
}

export function getConnectionHintForPlatform(
  platformOs: string,
  serverUrl: string,
): string | null {
  try {
    const parsed = new URL(serverUrl);
    const host = parsed.hostname.toLowerCase();

    if (platformOs === 'android' && isAndroidLoopbackHost(host)) {
      return `On Android, "${host}" refers to the device itself. Use ${ANDROID_EMULATOR_HOST} (emulator) or your PC's LAN IP (physical device).`;
    }

    if (parsed.protocol !== 'ws:' && parsed.protocol !== 'wss:') {
      return 'Server URL must start with ws:// or wss://';
    }
  } catch {
    return 'Invalid WebSocket URL.';
  }

  return null;
}

function getPlatformOs(): string {
  return Platform.OS;
}

function readMetroDevHostRuntime(): string | undefined {
  return readMetroDevHostFromConstants(Constants);
}

export function readMetroDevHost(): string | undefined {
  return readMetroDevHostRuntime();
}

export function resolveDevToolsHost(): string {
  return resolveDevToolsHostFromInputs(getPlatformOs(), readMetroDevHostRuntime());
}

export function getConnectionHint(serverUrl: string): string | null {
  return getConnectionHintForPlatform(getPlatformOs(), serverUrl);
}
