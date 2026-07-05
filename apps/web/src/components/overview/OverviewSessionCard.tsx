import { useState } from 'react';
import { shortenDeviceId } from 'database-devtools/client';
import { useDevTools } from '../../context/DevToolsContext';
import { CopyableValue } from './CopyableValue';
import { formatRelativeTime } from '../../lib/formatRelativeTime';
import { OverviewSessionBadge } from './OverviewSessionBadge';

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function OverviewSessionCard() {
  const {
    connectionState,
    selectedDevice,
    selectedDeviceId,
    deviceStatus,
    deviceDisplayName,
    lastUpdatedAt,
    isDeviceLive,
    isOfflineDatabase,
    hasLiveMobileAvailable,
    snapshotMeta,
  } = useDevTools();
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!selectedDevice && !selectedDeviceId) {
    return null;
  }

  const metadata = selectedDevice?.metadata;
  const platform = isDeviceLive
    ? (metadata?.platform ?? 'unknown')
    : 'offline export';
  const version = isDeviceLive ? (metadata?.appVersion ?? '—') : '—';

  return (
    <article className="overview-card">
      <h3 className="overview-card__title">Session</h3>

      <div className="overview-card__highlight">
        <OverviewSessionBadge />
        <div>
          <p className="overview-card__headline">{deviceDisplayName}</p>
          <p className="overview-card__subline">
            {platform} · v{version}
          </p>
        </div>
      </div>

      <dl className="overview-stats">
        <div className="overview-stats__row">
          <dt>Hub</dt>
          <dd>{connectionState === 'connected' ? 'Connected' : 'Offline'}</dd>
        </div>
        <div className="overview-stats__row">
          <dt>Device link</dt>
          <dd>
            {isDeviceLive
              ? 'Live'
              : hasLiveMobileAvailable
                ? 'Offline export · live available'
                : isOfflineDatabase
                  ? 'Offline export'
                  : 'Not connected'}
          </dd>
        </div>
        <div className="overview-stats__row">
          <dt>Mobile devices</dt>
          <dd>{deviceStatus?.mobileCount ?? 0}</dd>
        </div>
        <div className="overview-stats__row">
          <dt>Device</dt>
          <dd>{selectedDeviceId ? shortenDeviceId(selectedDeviceId) : '—'}</dd>
        </div>
        {lastUpdatedAt && (
          <div className="overview-stats__row">
            <dt>Status updated</dt>
            <dd title={formatTimestamp(lastUpdatedAt)}>{formatRelativeTime(lastUpdatedAt)}</dd>
          </div>
        )}
        {snapshotMeta?.exportedAt && isOfflineDatabase && (
          <div className="overview-stats__row">
            <dt>Export saved</dt>
            <dd title={formatTimestamp(snapshotMeta.exportedAt)}>
              {formatRelativeTime(snapshotMeta.exportedAt)}
            </dd>
          </div>
        )}
      </dl>

      {selectedDevice && (
        <>
          <button
            type="button"
            className="overview-card__toggle"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((open) => !open)}
          >
            {detailsOpen ? 'Hide device details' : 'Show device details'}
          </button>

          {detailsOpen && (
            <dl className="meta-list overview-card__details">
              <div className="meta-list__row">
                <dt>Bundle ID</dt>
                <dd className="mono">{metadata?.bundleId ?? '—'}</dd>
              </div>
              <div className="meta-list__row">
                <dt>Device ID</dt>
                <dd>
                  <CopyableValue mono value={selectedDevice.deviceId} />
                </dd>
              </div>
              <div className="meta-list__row">
                <dt>{isDeviceLive ? 'Connected at' : 'Export from'}</dt>
                <dd title={formatTimestamp(selectedDevice.connectedAt)}>
                  {formatRelativeTime(selectedDevice.connectedAt)}
                </dd>
              </div>
            </dl>
          )}
        </>
      )}
    </article>
  );
}
