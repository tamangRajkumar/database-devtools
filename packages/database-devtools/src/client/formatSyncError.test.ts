import { describe, expect, it } from 'vitest';
import { formatSyncErrorMessage } from './formatSyncError';

describe('formatSyncErrorMessage', () => {
  it('formats export failures with device context', () => {
    expect(formatSyncErrorMessage('EXPORT_FAILED', 'network error')).toContain(
      'Device failed to export or upload snapshot',
    );
  });

  it('formats device offline errors', () => {
    expect(formatSyncErrorMessage('DEVICE_OFFLINE', 'gone')).toContain('disconnected');
  });

  it('formats timeout errors', () => {
    expect(formatSyncErrorMessage('TIMEOUT', 'expired')).toContain('Timed out');
  });
});
