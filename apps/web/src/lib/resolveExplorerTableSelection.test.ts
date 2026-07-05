import { describe, expect, it } from 'vitest';
import { resolveExplorerTableSelection } from './resolveExplorerTableSelection';

describe('resolveExplorerTableSelection', () => {
  const tables = ['bookings', 'users'];

  it('keeps a valid current selection', () => {
    expect(resolveExplorerTableSelection('users', tables, false)).toBe('users');
  });

  it('returns null when the user cleared selection', () => {
    expect(resolveExplorerTableSelection(null, tables, true)).toBe(null);
  });

  it('selects the first table on initial load', () => {
    expect(resolveExplorerTableSelection(null, tables, false)).toBe('bookings');
  });

  it('falls back when the current table no longer exists', () => {
    expect(resolveExplorerTableSelection('deleted_table', tables, false)).toBe('bookings');
  });

  it('stays cleared when the current table no longer exists and user cleared selection', () => {
    expect(resolveExplorerTableSelection('deleted_table', tables, true)).toBe(null);
  });
});
