import { describe, expect, it } from 'vitest';
import { resolveSessionStatus } from './OverviewSessionBadge';

describe('resolveSessionStatus', () => {
  it('shows hub offline when the websocket is disconnected', () => {
    expect(
      resolveSessionStatus({
        hubState: 'disconnected',
        isDeviceLive: false,
        hasDatabase: true,
        hasLiveMobileAvailable: true,
      }),
    ).toBe('hub-offline');
  });

  it('shows device online when a mobile device is connected', () => {
    expect(
      resolveSessionStatus({
        hubState: 'connected',
        isDeviceLive: true,
        hasDatabase: true,
        hasLiveMobileAvailable: false,
      }),
    ).toBe('device-online');
  });

  it('shows offline export when only a saved export is loaded', () => {
    expect(
      resolveSessionStatus({
        hubState: 'connected',
        isDeviceLive: false,
        hasDatabase: true,
        hasLiveMobileAvailable: false,
      }),
    ).toBe('offline-export');
  });

  it('shows live available when a phone is online but another export is selected', () => {
    expect(
      resolveSessionStatus({
        hubState: 'connected',
        isDeviceLive: false,
        hasDatabase: true,
        hasLiveMobileAvailable: true,
      }),
    ).toBe('offline-export-live-available');
  });

  it('shows waiting when hub is up but no device or export is loaded', () => {
    expect(
      resolveSessionStatus({
        hubState: 'connected',
        isDeviceLive: false,
        hasDatabase: false,
        hasLiveMobileAvailable: false,
      }),
    ).toBe('waiting');
  });
});
