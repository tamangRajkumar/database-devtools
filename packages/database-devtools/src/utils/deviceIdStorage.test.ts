import { describe, expect, it } from 'vitest';

import { getDeviceIdStorage } from './deviceIdStorage';

describe('getDeviceIdStorage (Web / Node)', () => {
  it('does not load native storage', () => {
    expect(getDeviceIdStorage()).toBeNull();
  });
});
