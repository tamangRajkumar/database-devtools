import { describe, expect, it } from 'vitest';
import { resolveCorsOrigin } from './cors';

describe('resolveCorsOrigin', () => {
  it('returns configured origin when set', () => {
    expect(resolveCorsOrigin('http://localhost:5173', 'https://example.com')).toBe(
      'https://example.com',
    );
  });

  it('reflects localhost browser origins', () => {
    expect(resolveCorsOrigin('http://localhost:5173')).toBe('http://localhost:5173');
    expect(resolveCorsOrigin('http://127.0.0.1:5173')).toBe('http://127.0.0.1:5173');
  });

  it('returns wildcard when origin is missing', () => {
    expect(resolveCorsOrigin(undefined)).toBe('*');
  });
});
