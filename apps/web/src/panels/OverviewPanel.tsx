import { useDevTools } from '../context/DevToolsContext';
import { PlaceholderBanner } from '../components/PlaceholderBanner';
import { StatusBadge } from '../components/StatusBadge';

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
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

export function OverviewPanel() {
  const {
    connectionState,
    selectedDevice,
    deviceStatus,
    lastUpdatedAt,
    snapshotMeta,
    lastSnapshotAt,
    refreshState,
  } = useDevTools();

  if (!selectedDevice) {
    return (
      <section className="panel">
        <h2 className="panel__title">Overview</h2>
        <div className="empty-state">
          <p className="empty-state__title">No device selected</p>
          <p className="empty-state__text">
            Connect a mobile app with Database DevTools enabled to inspect it here.
          </p>
        </div>
      </section>
    );
  }

  const metadata = selectedDevice.metadata;
  const hasSnapshot = refreshState === 'ready' && snapshotMeta !== null;

  return (
    <section className="panel">
      <h2 className="panel__title">Overview</h2>
      {!hasSnapshot && <PlaceholderBanner />}

      <div className="card-grid">
        <article className="card">
          <h3 className="card__title">Hub connection</h3>
          <StatusBadge state={connectionState} />
          <p className="card__meta">
            {deviceStatus?.mobileCount ?? 0} mobile device(s) · {deviceStatus?.browserCount ?? 0}{' '}
            browser(s)
          </p>
        </article>

        <article className="card">
          <h3 className="card__title">Selected device</h3>
          <dl className="meta-list">
            <div className="meta-list__row">
              <dt>App</dt>
              <dd>{metadata?.appName ?? 'Unknown'}</dd>
            </div>
            <div className="meta-list__row">
              <dt>Platform</dt>
              <dd>{metadata?.platform ?? '—'}</dd>
            </div>
            <div className="meta-list__row">
              <dt>Version</dt>
              <dd>{metadata?.appVersion ?? '—'}</dd>
            </div>
            <div className="meta-list__row">
              <dt>Bundle ID</dt>
              <dd className="mono">{metadata?.bundleId ?? '—'}</dd>
            </div>
            <div className="meta-list__row">
              <dt>Device ID</dt>
              <dd className="mono">{selectedDevice.deviceId}</dd>
            </div>
            <div className="meta-list__row">
              <dt>Connected at</dt>
              <dd>{formatTimestamp(selectedDevice.connectedAt)}</dd>
            </div>
          </dl>
        </article>

        {hasSnapshot && snapshotMeta && (
          <article className="card">
            <h3 className="card__title">Database snapshot</h3>
            <dl className="meta-list">
              <div className="meta-list__row">
                <dt>Size</dt>
                <dd>{formatBytes(snapshotMeta.size)}</dd>
              </div>
              <div className="meta-list__row">
                <dt>Refreshed at</dt>
                <dd>{formatTimestamp(snapshotMeta.exportedAt)}</dd>
              </div>
              <div className="meta-list__row">
                <dt>Sync ID</dt>
                <dd className="mono">{snapshotMeta.syncId}</dd>
              </div>
            </dl>
          </article>
        )}
      </div>

      {lastSnapshotAt && (
        <p className="panel__footer">Last database refresh: {formatTimestamp(lastSnapshotAt)}</p>
      )}

      {lastUpdatedAt && (
        <p className="panel__footer">Last status update: {formatTimestamp(lastUpdatedAt)}</p>
      )}
    </section>
  );
}
