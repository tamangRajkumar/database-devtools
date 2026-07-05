import { shortenDeviceId } from 'database-devtools/client';
import { useDevTools } from '../../context/DevToolsContext';
import { formatRelativeTime } from '../../lib/formatRelativeTime';
import { OverviewSessionBadge } from './OverviewSessionBadge';

export function OverviewStatusHero({ onOpenWorkspace }: { onOpenWorkspace: () => void }) {
  const {
    selectedDeviceId,
    deviceDisplayName,
    hasDatabase,
    tables,
    snapshotMeta,
    refreshState,
    syncState,
    refresh,
    refreshError,
    isOfflineDatabase,
    isDeviceLive,
    canRefreshFromDevice,
    connectionState,
    liveMobileCount,
    hasLiveMobileAvailable,
    switchToConnectedDevice,
  } = useDevTools();

  if (!selectedDeviceId && !hasDatabase) {
    return null;
  }

  const refreshing = refreshState === 'refreshing';
  const refreshDisabled = !canRefreshFromDevice || refreshing;
  const deviceSummary = selectedDeviceId
    ? `${deviceDisplayName} · ${shortenDeviceId(selectedDeviceId)}`
    : 'No device selected';

  let databaseStatus = 'No database snapshot loaded';
  let databaseStatusTone: 'muted' | 'success' | 'warning' = 'warning';

  if (hasDatabase && snapshotMeta) {
    databaseStatusTone = 'success';
    const sourceLabel = isOfflineDatabase ? 'from offline export' : 'from live device';
    const sizeLabel = `${tables.length} table${tables.length === 1 ? '' : 's'} · ${formatBytes(snapshotMeta.size)}`;
    databaseStatus = `${sizeLabel} ${sourceLabel}`;
  } else if (refreshing) {
    databaseStatusTone = 'muted';
    databaseStatus = syncState === 'exporting'
      ? 'Exporting database on device…'
      : syncState === 'uploading'
        ? 'Uploading snapshot to hub…'
        : 'Refreshing database…';
  }

  const contextLine = isDeviceLive
    ? 'Mobile device connected to the hub'
    : hasLiveMobileAvailable
      ? `${liveMobileCount} device${liveMobileCount === 1 ? '' : 's'} online — switch to refresh live data`
      : isOfflineDatabase
        ? `Browsing saved export · last refreshed ${snapshotMeta ? formatRelativeTime(snapshotMeta.exportedAt) : 'unknown'}`
        : connectionState === 'connected'
          ? 'Hub connected · waiting for a device export'
          : 'Start the hub to connect';

  return (
    <section className="overview-hero" aria-label="Connection and database status">
      <div className="overview-hero__status">
        <div className="overview-hero__status-row">
          <OverviewSessionBadge />
          <span className="overview-hero__device">{deviceSummary}</span>
        </div>
        <p className="overview-hero__context">{contextLine}</p>
        <p className={`overview-hero__database overview-hero__database--${databaseStatusTone}`}>
          {databaseStatus}
        </p>
        {connectionState !== 'connected' && (
          <p className="overview-hero__hint">
            Start the hub with <code className="mono">npx database-devtools</code> on your machine.
          </p>
        )}
        {hasLiveMobileAvailable && connectionState === 'connected' && (
          <p className="overview-hero__hint">
            You are viewing a saved export. A connected device is available — switch to it, then use
            Refresh for live data.
          </p>
        )}
        {isOfflineDatabase && !hasLiveMobileAvailable && connectionState === 'connected' && (
          <p className="overview-hero__hint">
            Connect the mobile app and use Refresh to update this device export.
          </p>
        )}
        {refreshError && refreshState === 'error' && (
          <p className="overview-hero__error" role="alert">
            {refreshError}
          </p>
        )}
      </div>

      <div className="overview-hero__actions">
        {hasLiveMobileAvailable && (
          <button
            type="button"
            className="overview-hero__primary"
            onClick={switchToConnectedDevice}
          >
            Switch to connected device
          </button>
        )}

        {hasDatabase ? (
          <button
            type="button"
            className={hasLiveMobileAvailable ? 'overview-hero__secondary' : 'overview-hero__primary'}
            onClick={onOpenWorkspace}
          >
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

        {hasDatabase && (
          <button
            type="button"
            className="overview-hero__secondary"
            disabled={refreshDisabled}
            onClick={refresh}
            title={!canRefreshFromDevice ? 'Connect the device to refresh live data' : undefined}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        )}
      </div>
    </section>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
