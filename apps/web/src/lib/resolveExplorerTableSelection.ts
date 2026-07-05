/**
 * Resolves which table should be selected in Object Explorer after sync.
 */
export function resolveExplorerTableSelection(
  current: string | null,
  tableNames: string[],
  userClearedSelection: boolean,
): string | null {
  if (current && tableNames.includes(current)) {
    return current;
  }

  if (userClearedSelection) {
    return null;
  }

  return tableNames[0] ?? null;
}
