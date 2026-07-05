import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { ResultsExportMenu } from './ResultsExportMenu';

export function ResultsToolbar() {
  const { result, copyStatus } = useSqlWorkspace();
  const disabled = !result || result.columns.length === 0;

  return (
    <div className="results-toolbar">
      <div className="results-toolbar__actions">
        <ResultsExportMenu disabled={disabled} />
        {copyStatus && <span className="results-toolbar__status">{copyStatus}</span>}
      </div>
    </div>
  );
}
