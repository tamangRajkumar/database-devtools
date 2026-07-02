import { describe, expect, it } from 'vitest';
import type { DeviceStatusPayload } from '../types/protocol';
import {
  buildSnapshotLoadedToast,
  formatSnapshotReceivedMessage,
  resolveDeviceLabel,
  shortenDeviceId,
} from './deviceLabel';

describe('resolveDeviceLabel', () => {
  it('returns app name from device status', () => {
    const status: DeviceStatusPayload = {
      browserCount: 1,
      mobileCount: 1,
      browsers: [],
      mobiles: [
        {
          deviceId: 'device-abc',
          connectionId: 'mobile-1',
          connectedAt: Date.now(),
          metadata: { appName: 'Example App' },
        },
      ],
    };

    expect(resolveDeviceLabel('device-abc', status)).toEqual({
      deviceId: 'device-abc',
      deviceName: 'Example App',
    });
  });

  it('falls back when device is unknown', () => {
    expect(resolveDeviceLabel('device-missing', null)).toEqual({
      deviceId: 'device-missing',
      deviceName: 'Unknown device',
    });
  });
});

describe('shortenDeviceId', () => {
  it('shortens long device ids', () => {
    expect(shortenDeviceId('device-abcdefghijklmnop')).toBe('devi…mnop');
  });
});

describe('formatSnapshotReceivedMessage', () => {
  it('formats device and database labels', () => {
    expect(
      formatSnapshotReceivedMessage(
        { deviceId: 'device-abcdefghijklmnop', deviceName: 'Example App' },
        'booking.db',
      ),
    ).toBe('Example App (devi…mnop) · booking.db');
  });
});

describe('buildSnapshotLoadedToast', () => {
  const status: DeviceStatusPayload = {
    browserCount: 1,
    mobileCount: 1,
    browsers: [],
    mobiles: [
      {
        deviceId: 'device-abc',
        connectionId: 'mobile-1',
        connectedAt: Date.now(),
        metadata: { appName: 'Example App' },
      },
    ],
  };

  it('uses mobile title when pushed from device', () => {
    expect(buildSnapshotLoadedToast('mobile', 'device-abc', 'booking.db', status)).toEqual({
      title: 'New database received',
      message: 'Example App (devi…-abc) · booking.db',
    });
  });

  it('uses browser title when refreshed from web', () => {
    expect(buildSnapshotLoadedToast('browser', 'device-abc', 'booking.db', status)).toEqual({
      title: 'Database refreshed',
      message: 'Example App (devi…-abc) · booking.db',
    });
  });
});
