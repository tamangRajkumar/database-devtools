import { useDevTools } from '../../context/DevToolsContext';
import { RefreshButton } from '../RefreshButton';

export function WorkspaceEmptyState() {
  const { selectedDevice, hasDatabase } = useDevTools();

  if (!selectedDevice) {
    return (
      <div className="workspace-empty">
        <p className="workspace-empty__title">No device selected</p>
        <p className="workspace-empty__text">
          Connect a mobile app with Database DevTools enabled, then select it in the toolbar.
        </p>
      </div>
    );
  }

  if (hasDatabase) {
    return null;
  }

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
