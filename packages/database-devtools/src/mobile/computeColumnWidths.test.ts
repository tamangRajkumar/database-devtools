import { describe, expect, it } from 'vitest';
import {
  computeColumnWidths,
  defaultMobileDataViewMode,
  totalTableWidth,
} from './computeColumnWidths';

describe('computeColumnWidths', () => {
  it('allocates wider columns for email and timestamps', () => {
    const columns = ['email', 'name', 'created_at'];
    const rows = [
      ['ada@example.com', 'Ada Lovelace', '2026-07-01 13:55:00'],
      ['grace@example.com', 'Grace Hopper', '2026-07-01 13:55:01'],
    ];

    const widths = computeColumnWidths(columns, rows);

    expect(widths[0]).toBeGreaterThan(widths[1]!);
    expect(widths[2]).toBeGreaterThanOrEqual(188);
  });

  it('uses compact width for id columns', () => {
    const widths = computeColumnWidths(['id'], [[1], [2]]);

    expect(widths[0]).toBeLessThanOrEqual(96);
    expect(widths[0]).toBeGreaterThanOrEqual(72);
  });

  it('sums total table width', () => {
    const widths = computeColumnWidths(['a', 'b'], [['x', 'y']]);

    expect(totalTableWidth(widths)).toBe(widths[0]! + widths[1]!);
  });
});

describe('defaultMobileDataViewMode', () => {
  it('prefers cards for small column counts', () => {
    expect(defaultMobileDataViewMode(3)).toBe('cards');
    expect(defaultMobileDataViewMode(5)).toBe('table');
  });
});
