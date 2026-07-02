import { useState } from 'react';
import { resolveDeviceLabel, shortenDeviceId } from 'database-devtools/client';
import { useDevTools } from '../../context/DevToolsContext';
import { StatusBadge } from '../StatusBadge';
import { CopyableValue } from './CopyableValue';
import { formatRelativeTime } from '../../lib/formatRelativeTime';

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function OverviewSessionCard() {
  const { connectionState, selectedDevice, deviceStatus, lastUpdatedAt } = useDevTools();
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!selectedDevice) {
    return null;
  }

  const metadata = selectedDevice.metadata;
  const label = resolveDeviceLabel(selectedDevice.deviceId, deviceStatus);

  return (
    <article className="overview-card">
      <h3 className="overview-card__title">Session</h3>

      <div className="overview-card__highlight">
        <StatusBadge state={connectionState} />
        <div>
          <p className="overview-card__headline">{label.deviceName}</p>
          <p className="overview-card__subline">
            {metadata?.platform ?? '—'} · v{metadata?.appVersion ?? '—'}
          </p>
        </div>
      </div>

      <dl className="overview-stats">
        <div className="overview-stats__row">
          <dt>Mobile devices</dt>
          <dd>{deviceStatus?.mobileCount ?? 0}</dd>
        </div>
        <div className="overview-stats__row">
          <dt>Browsers</dt>
          <dd>{deviceStatus?.browserCount ?? 0}</dd>
        </div>
        <div className="overview-stats__row">
          <dt>Device</dt>
          <dd>{shortenDeviceId(label.deviceId)}</dd>
        </div>
        {lastUpdatedAt && (
          <div className="overview-stats__row">
            <dt>Status updated</dt>
            <dd title={formatTimestamp(lastUpdatedAt)}>{formatRelativeTime(lastUpdatedAt)}</dd>
          </div>
        )}
      </dl>

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
            <dt>Connected at</dt>
            <dd title={formatTimestamp(selectedDevice.connectedAt)}>
              {formatRelativeTime(selectedDevice.connectedAt)}
            </dd>
          </div>
        </dl>
      )}
    </article>
  );
}
