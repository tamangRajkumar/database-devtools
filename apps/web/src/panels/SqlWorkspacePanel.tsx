import { useDevTools } from '../context/DevToolsContext';
import { useSqlWorkspace } from '../context/SqlWorkspaceContext';
import { PlaceholderBanner } from '../components/PlaceholderBanner';
import { QuerySidebar } from '../components/sql-workspace/QuerySidebar';
import { ResultsPanel } from '../components/sql-workspace/ResultsPanel';
import { SaveFavoriteDialog } from '../components/sql-workspace/SaveFavoriteDialog';
import { SqlEditor } from '../components/sql-workspace/SqlEditor';
import { SqlToolbar } from '../components/sql-workspace/SqlToolbar';

export function SqlWorkspacePanel() {
  const { selectedDevice, hasDatabase } = useDevTools();
  const { sql, setSql, runQuery } = useSqlWorkspace();

  if (!selectedDevice) {
    return (
      <section className="panel">
        <h2 className="panel__title">SQL Workspace</h2>
        <div className="empty-state">
          <p className="empty-state__title">No device selected</p>
          <p className="empty-state__text">Select a connected device to run SQL queries.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel panel--sql-workspace">
      <h2 className="panel__title">SQL Workspace</h2>
      <p className="panel__subtitle mono">{selectedDevice.deviceId}</p>

      {!hasDatabase && (
        <PlaceholderBanner message="Click Refresh to load the database before running SQL." />
      )}

      <div className="sql-workspace">
        <QuerySidebar />
        <div className="sql-workspace__main">
          <SqlToolbar />
          <SqlEditor
            value={sql}
            onChange={setSql}
            onRun={runQuery}
            disabled={!hasDatabase}
          />
          <ResultsPanel />
        </div>
      </div>

      <SaveFavoriteDialog />
    </section>
  );
}
