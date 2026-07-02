import type { RefreshState } from 'database-devtools/protocol';
import { resolveDeviceLabel, shortenDeviceId } from 'database-devtools/client';
import { useDevTools } from '../../context/DevToolsContext';
import { StatusBadge } from '../StatusBadge';

function refreshStepLabel(syncState: RefreshState | null): string | null {
  switch (syncState) {
    case 'requested':
      return 'Requesting sync from device…';
    case 'exporting':
      return 'Exporting database on device…';
    case 'uploading':
      return 'Uploading snapshot to hub…';
    case 'ready':
      return 'Snapshot ready';
    default:
      return null;
  }
}

type OverviewStatusHeroProps = {
  onOpenWorkspace: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function OverviewStatusHero({ onOpenWorkspace }: OverviewStatusHeroProps) {
  const {
    connectionState,
    selectedDevice,
    deviceStatus,
    hasDatabase,
    tables,
    snapshotMeta,
    refreshState,
    syncState,
    refresh,
    refreshError,
  } = useDevTools();

  if (!selectedDevice) {
    return null;
  }

  const label = resolveDeviceLabel(selectedDevice.deviceId, deviceStatus);
  const deviceSummary = `${label.deviceName} · ${shortenDeviceId(label.deviceId)}`;
  const platform = selectedDevice.metadata?.platform ?? 'unknown';
  const refreshing = refreshState === 'refreshing';
  const refreshDisabled =
    connectionState !== 'connected' || refreshing || !selectedDevice.deviceId;
  const syncLabel = refreshStepLabel(syncState);

  let databaseStatus = 'No database snapshot loaded';
  let databaseStatusTone: 'muted' | 'success' | 'warning' = 'warning';

  if (hasDatabase && snapshotMeta) {
    databaseStatusTone = 'success';
    databaseStatus = `${tables.length} table${tables.length === 1 ? '' : 's'} · ${formatBytes(snapshotMeta.size)} loaded`;
  } else if (refreshing) {
    databaseStatusTone = 'muted';
    databaseStatus = syncLabel ?? 'Refreshing database…';
  }

  return (
    <section className="overview-hero" aria-label="Connection and database status">
      <div className="overview-hero__status">
        <div className="overview-hero__status-row">
          <StatusBadge state={connectionState} />
          <span className="overview-hero__device">
            {platform} · {deviceSummary}
          </span>
        </div>
        <p className={`overview-hero__database overview-hero__database--${databaseStatusTone}`}>
          {databaseStatus}
        </p>
        {connectionState !== 'connected' && (
          <p className="overview-hero__hint">
            Start the hub with <code className="mono">pnpm dev:cli</code> in the database-devtools
            folder.
          </p>
        )}
        {refreshError && refreshState === 'error' && (
          <p className="overview-hero__error" role="alert">
            {refreshError}
          </p>
        )}
      </div>

      <div className="overview-hero__actions">
        {hasDatabase ? (
          <button type="button" className="overview-hero__primary" onClick={onOpenWorkspace}>
            Open Workspace
          </button>
        ) : (
          <button
            type="button"
            className="overview-hero__primary"
            disabled={refreshDisabled}
            onClick={refresh}
          >
            {refreshing ? 'Refreshing…' : 'Refresh database'}
          </button>
        )}

        {hasDatabase ? (
          <button
            type="button"
            className="overview-hero__secondary"
            disabled={refreshDisabled}
            onClick={refresh}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        ) : (
          <button
            type="button"
            className="overview-hero__secondary"
            disabled={!hasDatabase}
            onClick={onOpenWorkspace}
            title={!hasDatabase ? 'Refresh the database snapshot first' : undefined}
          >
            Open Workspace
          </button>
        )}
      </div>
    </section>
  );
}
