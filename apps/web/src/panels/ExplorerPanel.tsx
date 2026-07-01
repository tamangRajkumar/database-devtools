import { useDevTools } from '../context/DevToolsContext';
import { PlaceholderBanner } from '../components/PlaceholderBanner';
import { DataGrid } from '../components/explorer/DataGrid';
import { ExplorerToolbar } from '../components/explorer/ExplorerToolbar';
import { PaginationBar } from '../components/explorer/PaginationBar';
import { RowDetailDrawer } from '../components/explorer/RowDetailDrawer';
import { SchemaView } from '../components/explorer/SchemaView';
import { TableListSidebar } from '../components/explorer/TableListSidebar';
import { useExplorer } from '../context/ExplorerContext';

export function ExplorerPanel() {
  const { selectedDevice, hasDatabase } = useDevTools();
  const { view } = useExplorer();

  if (!selectedDevice) {
    return (
      <section className="panel">
        <h2 className="panel__title">Explorer</h2>
        <div className="empty-state">
          <p className="empty-state__title">No device selected</p>
          <p className="empty-state__text">Select a connected device to browse the database.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel panel--explorer">
      <h2 className="panel__title">Explorer</h2>
      <p className="panel__subtitle mono">{selectedDevice.deviceId}</p>

      {!hasDatabase && (
        <PlaceholderBanner message="Click Refresh to load the database explorer." />
      )}

      {hasDatabase && (
        <div className="explorer">
          <TableListSidebar />
          <div className="explorer__main">
            <ExplorerToolbar />
            <div className="explorer__content">
              {view === 'data' ? <DataGrid /> : <SchemaView />}
            </div>
            {view === 'data' && <PaginationBar />}
            <RowDetailDrawer />
          </div>
        </div>
      )}
    </section>
  );
}
