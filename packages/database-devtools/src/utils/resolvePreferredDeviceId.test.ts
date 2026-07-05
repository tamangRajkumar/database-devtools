import { describe, expect, it } from 'vitest';
import type { MobileDeviceInfo } from '../types/protocol';
import {
  resolveLiveSwitchTarget,
  resolvePreferredDeviceId,
} from './resolvePreferredDeviceId';

const liveA: MobileDeviceInfo = {
  deviceId: 'device-live-a',
  connectionId: 'conn-a',
  connectedAt: Date.now(),
  metadata: { appName: 'Example App', bundleId: 'host.exp.exponent' },
};

const liveB: MobileDeviceInfo = {
  deviceId: 'device-live-b',
  connectionId: 'conn-b',
  connectedAt: Date.now(),
  metadata: { appName: 'Other App', bundleId: 'com.other.app' },
};

describe('resolvePreferredDeviceId', () => {
  it('keeps the selected device when it is live', () => {
    expect(
      resolvePreferredDeviceId({
        selectedDeviceId: 'device-live-a',
        mobiles: [liveA],
        exports: [{ deviceId: 'device-export-old', bundleId: 'host.exp.exponent' }],
      }),
    ).toBe('device-live-a');
  });

  it('auto-switches to the live device with the same bundle id', () => {
    expect(
      resolvePreferredDeviceId({
        selectedDeviceId: 'device-export-old',
        mobiles: [liveA],
        exports: [{ deviceId: 'device-export-old', bundleId: 'host.exp.exponent' }],
      }),
    ).toBe('device-live-a');
  });

  it('auto-switches to the only live device when bundle metadata is missing', () => {
    expect(
      resolvePreferredDeviceId({
        selectedDeviceId: 'device-export-old',
        mobiles: [liveA],
        exports: [{ deviceId: 'device-export-old' }],
      }),
    ).toBe('device-live-a');
  });

  it('keeps export selection when multiple mobiles are connected and bundle does not match', () => {
    expect(
      resolvePreferredDeviceId({
        selectedDeviceId: 'device-export-old',
        mobiles: [liveA, liveB],
        exports: [{ deviceId: 'device-export-old', bundleId: 'legacy.bundle' }],
      }),
    ).toBe('device-export-old');
  });

  it('falls back to the first live device when selection is stale', () => {
    expect(
      resolvePreferredDeviceId({
        selectedDeviceId: 'device-missing',
        mobiles: [liveA],
        exports: [{ deviceId: 'device-export-old' }],
      }),
    ).toBe('device-live-a');
  });
});

describe('resolveLiveSwitchTarget', () => {
  it('returns null when the selected device is already live', () => {
    expect(
      resolveLiveSwitchTarget({
        selectedDeviceId: 'device-live-a',
        mobiles: [liveA],
        exports: [],
      }),
    ).toBeNull();
  });

  it('returns the connected device with the same bundle id', () => {
    expect(
      resolveLiveSwitchTarget({
        selectedDeviceId: 'device-export-old',
        mobiles: [liveA],
        exports: [{ deviceId: 'device-export-old', bundleId: 'host.exp.exponent' }],
      }),
    ).toBe('device-live-a');
  });
});
