import { useExplorer } from '../../context/ExplorerContext';
import { DataGrid } from '../explorer/DataGrid';
import { ExplorerToolbar } from '../explorer/ExplorerToolbar';
import { PaginationBar } from '../explorer/PaginationBar';
import { RowDetailDrawer } from '../explorer/RowDetailDrawer';
import { SchemaView } from '../explorer/SchemaView';

export function TableBrowsePanel() {
  const { selectedTable, view } = useExplorer();

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
      <RowDetailDrawer />
    </div>
  );
}
