import { useDevTools } from '../../context/DevToolsContext';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { resolveDeviceLabel, shortenDeviceId } from 'database-devtools/client';

export function StatusBar() {
  const { selectedDevice, deviceStatus, snapshotMeta, hasDatabase, tables } = useDevTools();
  const { executionMeta } = useSqlWorkspace();

  if (!selectedDevice) {
    return (
      <footer className="status-bar" aria-live="polite">
        <span className="status-bar__item">No device selected</span>
      </footer>
    );
  }

  const label = resolveDeviceLabel(selectedDevice.deviceId, deviceStatus);
  const databaseName = snapshotMeta?.databaseName ?? snapshotMeta?.kind ?? '—';

  return (
    <footer className="status-bar" aria-live="polite">
      <div className="status-bar__left">
        {executionMeta && (
          <span className="status-bar__item">
            {executionMeta.rowCount} row{executionMeta.rowCount === 1 ? '' : 's'} ·{' '}
            {executionMeta.durationMs.toFixed(1)} ms
          </span>
        )}
        {hasDatabase && (
          <span className="status-bar__item">{tables.length} table{tables.length === 1 ? '' : 's'}</span>
        )}
      </div>
      <div className="status-bar__right">
        <span className="status-bar__item">
          {label.deviceName} ({shortenDeviceId(label.deviceId)})
        </span>
        <span className="status-bar__separator">·</span>
        <span className="status-bar__item mono">{databaseName}</span>
      </div>
    </footer>
  );
}
