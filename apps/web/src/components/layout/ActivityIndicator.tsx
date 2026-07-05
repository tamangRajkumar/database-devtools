import { useDevTools } from '../../context/DevToolsContext';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';

function refreshStepLabel(syncState: string | null, refreshing: boolean): string | null {
  if (!refreshing) {
    return null;
  }

  switch (syncState) {
    case 'requested':
      return 'Requesting sync…';
    case 'exporting':
      return 'Exporting on device…';
    case 'uploading':
      return 'Uploading snapshot…';
    case 'ready':
      return 'Snapshot ready';
    default:
      return 'Refreshing database…';
  }
}

export function ActivityIndicator() {
  const { refreshState, syncState } = useDevTools();
  const { running } = useSqlWorkspace();

  const refreshLabel = refreshStepLabel(syncState, refreshState === 'refreshing');

  if (!running && !refreshLabel) {
    return null;
  }

  return (
    <div className="activity-indicator" role="status" aria-live="polite">
      <span className="activity-indicator__spinner" aria-hidden />
      <span>{running ? 'Running query…' : refreshLabel}</span>
    </div>
  );
}
