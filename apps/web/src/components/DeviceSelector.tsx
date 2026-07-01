import { useDevTools } from '../context/DevToolsContext';

function truncateId(id: string): string {
  if (id.length <= 20) {
    return id;
  }

  return `${id.slice(0, 10)}…${id.slice(-6)}`;
}

export function DeviceSelector() {
  const { deviceStatus, selectedDeviceId, setSelectedDeviceId } = useDevTools();
  const mobiles = deviceStatus?.mobiles ?? [];
  const disabled = mobiles.length === 0;

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
      >
        {disabled ? (
          <option value="">No devices connected</option>
        ) : (
          mobiles.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.metadata?.appName ?? 'Mobile App'}
              {device.metadata?.platform ? ` (${device.metadata.platform})` : ''}
              {' — '}
              {truncateId(device.deviceId)}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
