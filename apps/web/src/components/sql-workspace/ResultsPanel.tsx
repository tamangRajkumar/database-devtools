import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { ResultsToolbar } from './ResultsToolbar';

export function ResultsPanel() {
  const { result, error } = useSqlWorkspace();

  if (error) {
    return (
      <div className="sql-results">
        <p className="query-error" role="alert">
          {error}
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="sql-results explorer-empty">
        <p>Run a query to see results here.</p>
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
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {result.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    {cell === null ? <span className="data-grid__null">NULL</span> : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
