import { shortenDeviceId } from 'database-devtools/client';
import { useDevTools } from '../context/DevToolsContext';

function truncateId(id: string): string {
  if (id.length <= 20) {
    return id;
  }

  return `${id.slice(0, 10)}…${id.slice(-6)}`;
}

function formatExportAge(updatedAt: number): string {
  const minutes = Math.floor((Date.now() - updatedAt) / 60_000);

  if (minutes < 1) {
    return 'just now';
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.floor(hours / 24)}d ago`;
}

function getEmptyLabel(connectionState: string): string {
  if (connectionState === 'connected') {
    return 'No device or export available';
  }

  if (connectionState === 'reconnecting' || connectionState === 'connecting') {
    return 'Connecting to hub…';
  }

  return 'Hub disconnected — run npx database-devtools';
}

export function DeviceSelector() {
  const {
    connectionState,
    deviceStatus,
    deviceExports,
    selectedDeviceId,
    setSelectedDeviceId,
  } = useDevTools();

  const mobiles = deviceStatus?.mobiles ?? [];
  const connectedIds = new Set(mobiles.map((device) => device.deviceId));
  const connectedBundleIds = new Set(
    mobiles
      .map((device) => device.metadata?.bundleId)
      .filter((bundleId): bundleId is string => Boolean(bundleId)),
  );
  const offlineExports = deviceExports.filter((entry) => {
    if (!entry.deviceId || connectedIds.has(entry.deviceId)) {
      return false;
    }

    if (entry.bundleId && connectedBundleIds.has(entry.bundleId)) {
      return false;
    }

    return true;
  });
  const disabled = mobiles.length === 0 && offlineExports.length === 0;

  return (
    <div className="device-selector">
      <label className="device-selector__label" htmlFor="device-select">
        Device
      </label>
      <select
        id="device-select"
        className="device-selector__select"
        disabled={disabled}
        value={selectedDeviceId ?? ''}
        onChange={(event) => setSelectedDeviceId(event.target.value || null)}
        title={disabled ? getEmptyLabel(connectionState) : undefined}
      >
        {disabled ? (
          <option value="">{getEmptyLabel(connectionState)}</option>
        ) : (
          <>
            {mobiles.length > 0 && (
              <optgroup label="Connected">
                {mobiles.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.metadata?.appName ?? 'Mobile App'}
                    {device.metadata?.platform ? ` (${device.metadata.platform})` : ''}
                    {' — '}
                    {truncateId(device.deviceId)}
                  </option>
                ))}
              </optgroup>
            )}
            {offlineExports.length > 0 && (
              <optgroup label="Offline exports">
                {offlineExports.map((entry) => (
                  <option key={entry.storageKey ?? entry.deviceId} value={entry.deviceId!}>
                    {entry.label || entry.databaseName}
                    {' — '}
                    {shortenDeviceId(entry.deviceId!)}
                    {` (${formatExportAge(entry.updatedAt)})`}
                  </option>
                ))}
              </optgroup>
            )}
          </>
        )}
      </select>
    </div>
  );
}
