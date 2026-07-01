import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { formatHistoryLabel } from '../../lib/queryStorage';

export function HistoryList() {
  const { history, loadFromHistory, clearHistory } = useSqlWorkspace();

  if (history.length === 0) {
    return <p className="sql-sidebar__empty">No query history yet.</p>;
  }

  return (
    <>
      <div className="sql-sidebar__actions">
        <button type="button" className="sql-sidebar__link" onClick={clearHistory}>
          Clear history
        </button>
      </div>
      <ul className="sql-sidebar__list">
        {history.map((entry) => (
          <li key={entry.id}>
            <button
              type="button"
              className={`sql-sidebar__item ${entry.error ? 'sql-sidebar__item--error' : ''}`}
              onClick={() => loadFromHistory(entry.id)}
            >
              <span className="sql-sidebar__item-title mono">{formatHistoryLabel(entry)}</span>
              <span className="sql-sidebar__item-meta">
                {new Date(entry.ranAt).toLocaleString()}
                {entry.error ? ' · Error' : ` · ${entry.rowCount ?? 0} rows`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
