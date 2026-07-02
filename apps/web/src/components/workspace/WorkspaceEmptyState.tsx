import { useDevTools } from '../../context/DevToolsContext';
import { RefreshButton } from '../RefreshButton';

export function WorkspaceEmptyState() {
  const { selectedDevice, hasDatabase, tables } = useDevTools();

  if (!selectedDevice) {
    return (
      <div className="workspace-empty">
        <div>
          <p className="workspace-empty__title">No device selected</p>
          <p className="workspace-empty__text">
            Connect a mobile app with Database DevTools enabled, then select it in the toolbar.
          </p>
        </div>
      </div>
    );
  }

  if (!hasDatabase) {
    return (
      <div className="workspace-empty workspace-empty--inline">
        <div>
          <p className="workspace-empty__title">No database loaded</p>
          <p className="workspace-empty__text">
            Refresh to pull a snapshot from the device before running SQL or browsing tables.
          </p>
        </div>
        <RefreshButton />
      </div>
    );
  }

  return (
    <div className="workspace-empty workspace-empty--inline workspace-empty--tips">
      <div>
        <p className="workspace-empty__title">Ready to query</p>
        <p className="workspace-empty__text">
          {tables.length} table{tables.length === 1 ? '' : 's'} available · single-click a table to
          browse · double-click for SELECT TOP 100 · Ctrl+Enter to run
        </p>
      </div>
    </div>
  );
}
