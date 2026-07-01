import { useDevTools } from '../../context/DevToolsContext';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';

export function SqlToolbar() {
  const { hasDatabase } = useDevTools();
  const { running, runQuery, openSaveDialog, result, error } = useSqlWorkspace();

  return (
    <div className="sql-toolbar">
      <div className="sql-toolbar__left">
        <button
          type="button"
          className="query-run-button"
          disabled={!hasDatabase || running}
          onClick={runQuery}
        >
          {running ? 'Running…' : 'Run'}
        </button>
        <button type="button" className="sql-toolbar__secondary" onClick={openSaveDialog}>
          Save favorite
        </button>
        <span className="sql-toolbar__hint">Ctrl+Enter to run</span>
      </div>
      <div className="sql-toolbar__right">
        <span className="field-label__hint">Read-only: SELECT, PRAGMA, EXPLAIN, WITH</span>
        {result && !error && (
          <span className="query-meta">
            {result.rowCount} row{result.rowCount === 1 ? '' : 's'} · {result.durationMs.toFixed(1)} ms
          </span>
        )}
      </div>
    </div>
  );
}
