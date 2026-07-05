export type SqlEditorSelection = {
  from: number;
  to: number;
};

/**
 * Returns the SQL to execute: trimmed selection when non-empty, otherwise the full document.
 */
export function getSqlToRun(doc: string, selection: SqlEditorSelection): string {
  const { from, to } = selection;

  if (from !== to) {
    const selected = doc.slice(from, to).trim();

    if (selected) {
      return selected;
    }
  }

  return doc;
}
