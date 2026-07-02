import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';

export function ResultsToolbar() {
  const { result, copyResults, exportCsv, exportJson, copyStatus } = useSqlWorkspace();
  const disabled = !result || result.columns.length === 0;

  return (
    <div className="results-toolbar">
      <div className="results-toolbar__actions">
        <button type="button" className="sql-toolbar__secondary" disabled={disabled} onClick={() => void copyResults()}>
          Copy
        </button>
        <button type="button" className="sql-toolbar__secondary" disabled={disabled} onClick={exportCsv}>
          CSV
        </button>
        <button type="button" className="sql-toolbar__secondary" disabled={disabled} onClick={exportJson}>
          JSON
        </button>
        {copyStatus && <span className="results-toolbar__status">{copyStatus}</span>}
      </div>
    </div>
  );
}
