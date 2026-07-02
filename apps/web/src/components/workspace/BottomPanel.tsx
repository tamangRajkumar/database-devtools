import { useExplorer } from '../../context/ExplorerContext';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { BottomPanelTab } from '../../types/workspace';
import { HistoryPanel } from './HistoryPanel';
import { ResultsPanel } from '../sql-workspace/ResultsPanel';
import { TableBrowsePanel } from './TableBrowsePanel';

function tabLabel(tab: BottomPanelTab, rowCount: number | null): string {
  switch (tab) {
    case 'results':
      return rowCount === null ? 'Results' : `Results (${rowCount})`;
    case 'messages':
      return 'Messages';
    case 'data':
      return 'Data';
    case 'schema':
      return 'Schema';
    case 'history':
      return 'History';
  }
}

const TABS: BottomPanelTab[] = ['results', 'messages', 'data', 'schema', 'history'];

export function BottomPanel() {
  const { bottomPanelTab, setBottomPanelTab } = useWorkspace();
  const { result, error, lastMessage, executionMeta } = useSqlWorkspace();
  const { setView } = useExplorer();

  const rowCount = result?.rowCount ?? null;

  const handleTabChange = (tab: BottomPanelTab) => {
    setBottomPanelTab(tab);

    if (tab === 'data') {
      setView('data');
    }

    if (tab === 'schema') {
      setView('schema');
    }
  };

  return (
    <div className="bottom-panel">
      <div className="bottom-panel__tabs" role="tablist" aria-label="Output panels">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={bottomPanelTab === tab}
            className={`bottom-panel__tab ${bottomPanelTab === tab ? 'bottom-panel__tab--active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tabLabel(tab, tab === 'results' ? rowCount : null)}
          </button>
        ))}
      </div>

      <div className="bottom-panel__content" role="tabpanel">
        {bottomPanelTab === 'results' && <ResultsPanel />}
        {bottomPanelTab === 'messages' && (
          <div className="bottom-panel__messages">
            {error ? (
              <p className="query-error" role="alert">
                {error}
              </p>
            ) : lastMessage ? (
              <p className="bottom-panel__message">{lastMessage}</p>
            ) : executionMeta ? (
              <p className="bottom-panel__message">
                Last query: {executionMeta.rowCount} row{executionMeta.rowCount === 1 ? '' : 's'} in{' '}
                {executionMeta.durationMs.toFixed(1)} ms
              </p>
            ) : (
              <p className="bottom-panel__placeholder">Query messages and errors appear here.</p>
            )}
          </div>
        )}
        {bottomPanelTab === 'data' && <TableBrowsePanel view="data" />}
        {bottomPanelTab === 'schema' && <TableBrowsePanel view="schema" />}
        {bottomPanelTab === 'history' && (
          <div className="bottom-panel__history">
            <HistoryPanel />
          </div>
        )}
      </div>
    </div>
  );
}
