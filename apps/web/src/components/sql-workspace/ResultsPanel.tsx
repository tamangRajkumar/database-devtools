import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { QueryResultsGrid } from '../workspace/QueryResultsGrid';
import { ResultsToolbar } from './ResultsToolbar';

export function ResultsPanel() {
  const { result, error, running } = useSqlWorkspace();
  const { setBottomPanelTab } = useWorkspace();

  if (running) {
    return (
      <div className="sql-results explorer-empty">
        <div className="loading-skeleton loading-skeleton--text">Running query…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sql-results explorer-empty">
        <p className="query-error" role="alert">
          {error}
        </p>
        <button type="button" className="sql-toolbar__secondary" onClick={() => setBottomPanelTab('output')}>
          View details in Output
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="sql-results explorer-empty">
        <p>Run a query to see results here.</p>
        <p className="bottom-panel__placeholder">
          Tip: click a table in Object Explorer, or use SELECT TOP 100 from the context menu.
        </p>
      </div>
    );
  }

  if (result.columns.length === 0) {
    return (
      <div className="sql-results">
        <ResultsToolbar />
        <p className="panel__footer">Query completed with no result set.</p>
      </div>
    );
  }

  return (
    <div className="sql-results">
      <ResultsToolbar />
      <QueryResultsGrid columns={result.columns} rows={result.rows} />
    </div>
  );
}
