import { describe, expect, it } from 'vitest';
import { getSqlToRun } from './getSqlToRun';

const SCRIPT = 'select * from users;\nselect * from bookings;';

describe('getSqlToRun', () => {
  it('returns trimmed selection when text is highlighted', () => {
    const selected = 'select * from bookings;';
    const from = SCRIPT.indexOf(selected);
    const to = from + selected.length;

    expect(getSqlToRun(SCRIPT, { from, to })).toBe(selected);
  });

  it('returns the full document when there is no selection', () => {
    expect(getSqlToRun(SCRIPT, { from: 0, to: 0 })).toBe(SCRIPT);
  });

  it('returns the full document when selection is only whitespace', () => {
    const newlineIndex = SCRIPT.indexOf('\n');

    expect(getSqlToRun(SCRIPT, { from: newlineIndex, to: newlineIndex + 1 })).toBe(SCRIPT);
  });

  it('returns multi-line selection as-is after trim', () => {
    const doc = 'select 1;\n\nselect 2;';
    const selected = '\nselect 2;';

    expect(getSqlToRun(doc, { from: 10, to: 10 + selected.length })).toBe('select 2;');
  });
});
