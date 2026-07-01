import { useState } from 'react';
import type { QueryResult } from 'database-devtools';
import { DEFAULT_SQL, useDevTools } from '../context/DevToolsContext';
import { PlaceholderBanner } from '../components/PlaceholderBanner';

export function QueryPanel() {
  const { selectedDevice, hasDatabase, executeQuery, queryError, clearQueryError } = useDevTools();
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [running, setRunning] = useState(false);

  if (!selectedDevice) {
    return (
      <section className="panel">
        <h2 className="panel__title">Query</h2>
        <div className="empty-state">
          <p className="empty-state__title">No device selected</p>
          <p className="empty-state__text">Select a connected device to run queries.</p>
        </div>
      </section>
    );
  }

  const runQuery = () => {
    if (!hasDatabase || running) {
      return;
    }

    setRunning(true);
    clearQueryError();

    try {
      setResult(executeQuery(sql));
    } catch {
      setResult(null);
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="panel">
      <h2 className="panel__title">Query</h2>
      <p className="panel__subtitle mono">{selectedDevice.deviceId}</p>
      {!hasDatabase && <PlaceholderBanner message="Click Refresh to load the database before running SQL." />}

      <label className="field-label" htmlFor="sql-editor">
        SQL <span className="field-label__hint">(read-only: SELECT, PRAGMA, EXPLAIN, WITH)</span>
      </label>
      <textarea
        id="sql-editor"
        className="sql-editor mono"
        rows={8}
        value={sql}
        disabled={!hasDatabase}
        onChange={(event) => setSql(event.target.value)}
      />

      <div className="query-actions">
        <button
          type="button"
          className="query-run-button"
          disabled={!hasDatabase || running}
          onClick={runQuery}
        >
          {running ? 'Running…' : 'Run'}
        </button>
        {result && (
          <span className="query-meta">
            {result.rowCount} row{result.rowCount === 1 ? '' : 's'} · {result.durationMs.toFixed(1)} ms
          </span>
        )}
      </div>

      {queryError && (
        <p className="query-error" role="alert">
          {queryError}
        </p>
      )}

      {result && result.columns.length > 0 && (
        <>
          <h3 className="panel__section-title">Results</h3>
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
                      <td key={cellIndex}>{cell === null ? 'NULL' : String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {result && result.columns.length === 0 && !queryError && (
        <p className="panel__footer">Query completed with no result set.</p>
      )}
    </section>
  );
}
