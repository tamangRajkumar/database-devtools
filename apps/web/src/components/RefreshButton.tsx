import { useDevTools } from '../context/DevToolsContext';
import type { RefreshState } from 'database-devtools/protocol';

function refreshStateLabel(state: RefreshState | null): string | null {
  switch (state) {
    case 'requested':
      return 'Requesting sync…';
    case 'exporting':
      return 'Exporting on device…';
    case 'uploading':
      return 'Uploading snapshot…';
    case 'ready':
      return 'Snapshot ready';
    case 'failed':
    case 'timeout':
      return 'Sync failed';
    default:
      return null;
  }
}

export function RefreshButton() {
  const {
    connectionState,
    selectedDeviceId,
    refreshState,
    syncState,
    refreshError,
    refresh,
  } = useDevTools();

  const disabled =
    connectionState !== 'connected' || !selectedDeviceId || refreshState === 'refreshing';

  const statusLabel = refreshStateLabel(syncState);

  return (
    <div className="refresh-control">
      <button
        type="button"
        className="refresh-button"
        disabled={disabled}
        onClick={refresh}
        aria-busy={refreshState === 'refreshing'}
      >
        {refreshState === 'refreshing' ? 'Refreshing…' : 'Refresh'}
      </button>
      {statusLabel && refreshState === 'refreshing' && (
        <span className="refresh-control__status">{statusLabel}</span>
      )}
      {refreshError && refreshState === 'error' && (
        <span className="refresh-control__error" role="alert" title={refreshError}>
          {refreshError.length > 48 ? `${refreshError.slice(0, 48)}…` : refreshError}
        </span>
      )}
    </div>
  );
}
