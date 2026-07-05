import { useExplorer } from '../../context/ExplorerContext';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import type { BottomPanelTab } from '../../types/workspace';
import { HistoryPanel } from './HistoryPanel';
import { ResultsPanel } from '../sql-workspace/ResultsPanel';
import { TableBrowsePanel } from './TableBrowsePanel';

function tabLabel(tab: BottomPanelTab, rowCount: number | null, unread: boolean): string {
  switch (tab) {
    case 'results':
      return rowCount === null ? 'Results' : `Results (${rowCount})`;
    case 'data':
      return 'Data';
    case 'output':
      return unread ? 'Output •' : 'Output';
    case 'history':
      return 'History';
  }
}

const TABS: BottomPanelTab[] = ['results', 'data', 'output', 'history'];

export function BottomPanel() {
  const { bottomPanelTab, setBottomPanelTab, outputUnread } = useWorkspace();
  const { result, error, lastMessage, executionMeta } = useSqlWorkspace();
  const { selectedTable } = useExplorer();

  const rowCount = result?.rowCount ?? null;

  const handleTabChange = (tab: BottomPanelTab) => {
    setBottomPanelTab(tab);
  };

  return (
    <div className="bottom-panel">
      <div className="bottom-panel__header">
        <div className="bottom-panel__tabs" role="tablist" aria-label="Output panels">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={bottomPanelTab === tab}
              className={`bottom-panel__tab ${bottomPanelTab === tab ? 'bottom-panel__tab--active' : ''} ${tab === 'output' && outputUnread ? 'bottom-panel__tab--unread' : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              {tabLabel(tab, tab === 'results' ? rowCount : null, outputUnread)}
            </button>
          ))}
        </div>
        {selectedTable && bottomPanelTab === 'data' && (
          <p className="bottom-panel__breadcrumb mono">{selectedTable}</p>
        )}
      </div>

      <div className="bottom-panel__content" role="tabpanel">
        {bottomPanelTab === 'results' && <ResultsPanel />}
        {bottomPanelTab === 'data' && <TableBrowsePanel />}
        {bottomPanelTab === 'output' && (
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
              <p className="bottom-panel__placeholder">
                Query messages, timing info, and errors appear here.
              </p>
            )}
          </div>
        )}
        {bottomPanelTab === 'history' && (
          <div className="bottom-panel__history">
            <HistoryPanel />
          </div>
        )}
      </div>
    </div>
  );
}
