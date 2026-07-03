import { useDevTools } from '../../context/DevToolsContext';
import { useExplorer } from '../../context/ExplorerContext';
import { DataGrid } from '../explorer/DataGrid';
import { ExplorerToolbar } from '../explorer/ExplorerToolbar';
import { PaginationBar } from '../explorer/PaginationBar';
import { SchemaView } from '../explorer/SchemaView';
import { RefreshButton } from '../RefreshButton';

export function TableBrowsePanel() {
  const { hasDatabase } = useDevTools();
  const { selectedTable, view } = useExplorer();

  if (!hasDatabase) {
    return (
      <div className="explorer-empty explorer-empty--panel">
        <p className="explorer-empty__title">No database loaded</p>
        <p className="explorer-empty__text">Refresh to browse table data on the Data tab.</p>
        <RefreshButton />
      </div>
    );
  }

  if (!selectedTable) {
    return (
      <div className="explorer-empty">
        <p>Select a table in Object Explorer to browse data or schema.</p>
      </div>
    );
  }

  return (
    <div className="table-browse-panel">
      <ExplorerToolbar embedded />
      <div className="table-browse-panel__content">
        {view === 'data' ? <DataGrid /> : <SchemaView />}
      </div>
      {view === 'data' && <PaginationBar />}
    </div>
  );
}
