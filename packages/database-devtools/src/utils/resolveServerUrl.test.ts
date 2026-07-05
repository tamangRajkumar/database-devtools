import { afterEach, describe, expect, it } from 'vitest';
import {
  ANDROID_EMULATOR_HOST,
  getConnectionHintForPlatform,
  isAndroidLoopbackHost,
  readMetroDevHostFromConstants,
  resolveDevToolsHostFromInputs,
} from './resolveDevToolsHost';
import { normalizeServerUrl, resolveServerUrl } from './resolveServerUrl';

describe('isAndroidLoopbackHost', () => {
  it('detects loopback hostnames', () => {
    expect(isAndroidLoopbackHost('localhost')).toBe(true);
    expect(isAndroidLoopbackHost('127.0.0.1')).toBe(true);
    expect(isAndroidLoopbackHost('192.168.1.10')).toBe(false);
  });
});

describe('resolveDevToolsHostFromInputs', () => {
  it('uses Metro LAN host on Android physical device', () => {
    expect(resolveDevToolsHostFromInputs('android', '192.168.1.20')).toBe('192.168.1.20');
  });

  it('uses emulator alias when Android Metro host is localhost', () => {
    expect(resolveDevToolsHostFromInputs('android', 'localhost')).toBe(ANDROID_EMULATOR_HOST);
  });

  it('uses emulator alias when Android has no Metro host', () => {
    expect(resolveDevToolsHostFromInputs('android')).toBe(ANDROID_EMULATOR_HOST);
  });

  it('falls back to localhost on iOS without Metro host', () => {
    expect(resolveDevToolsHostFromInputs('ios')).toBe('localhost');
  });
});

describe('readMetroDevHostFromConstants', () => {
  it('parses host from expo hostUri', () => {
    expect(
      readMetroDevHostFromConstants({ expoConfig: { hostUri: '10.0.0.5:19000' } }),
    ).toBe('10.0.0.5');
  });
});

describe('getConnectionHintForPlatform', () => {
  it('warns when Android uses localhost', () => {
    const hint = getConnectionHintForPlatform('android', 'ws://localhost:3847/ws');
    expect(hint).toContain('10.0.2.2');
  });
});

describe('resolveServerUrl', () => {
  const originalEnv = process.env.EXPO_PUBLIC_DATABASE_DEVTOOLS_URL;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.EXPO_PUBLIC_DATABASE_DEVTOOLS_URL;
    } else {
      process.env.EXPO_PUBLIC_DATABASE_DEVTOOLS_URL = originalEnv;
    }
  });

  it('returns explicit prop unchanged when ws scheme provided', () => {
    expect(resolveServerUrl('ws://custom:9999/ws')).toBe('ws://custom:9999/ws');
  });

  it('builds ws url from host env without scheme', () => {
    process.env.EXPO_PUBLIC_DATABASE_DEVTOOLS_URL = '192.168.1.5';
    expect(resolveServerUrl()).toBe('ws://192.168.1.5:3847/ws');
  });

  it('normalizes bare host strings', () => {
    expect(normalizeServerUrl('10.0.2.2')).toBe('ws://10.0.2.2:3847/ws');
  });
});
