import { useDevTools } from '../context/DevToolsContext';
import { OverviewDatabaseCard } from '../components/overview/OverviewDatabaseCard';
import { OverviewSessionCard } from '../components/overview/OverviewSessionCard';
import { OverviewStatusHero } from '../components/overview/OverviewStatusHero';
import { OverviewTablePreview } from '../components/overview/OverviewTablePreview';
import { formatRelativeTime } from '../lib/formatRelativeTime';

type OverviewPanelProps = {
  onOpenWorkspace: () => void;
  onBrowseTable: (tableName: string) => void;
  onBrowseTables: () => void;
  onRunSql: () => void;
};

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function OverviewPanel({
  onOpenWorkspace,
  onBrowseTable,
  onBrowseTables,
  onRunSql,
}: OverviewPanelProps) {
  const { selectedDevice, lastSnapshotAt, lastUpdatedAt, hasDatabase } = useDevTools();

  if (!selectedDevice && !hasDatabase) {
    return (
      <section className="panel panel--overview panel--overview-empty">
        <div className="overview-empty">
          <h2 className="overview-empty__title">No device connected</h2>
          <p className="overview-empty__text">
            Connect a mobile app and refresh once, or select a device with a saved export.
          </p>
          <ol className="overview-empty__steps">
            <li>
              Run <code className="mono">npx database-devtools</code> on your machine
            </li>
            <li>Open your mobile app with <code className="mono">DatabaseDevTools</code> enabled</li>
            <li>Refresh once to save <code className="mono">Database-{'{deviceId}'}.db</code></li>
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section className="panel panel--overview">
      <header className="overview-header">
        <h2 className="panel__title">Overview</h2>
        <p className="overview-header__subtitle">
          Connection status, database snapshot, and quick links into Workspace.
        </p>
      </header>

      <OverviewStatusHero onOpenWorkspace={onOpenWorkspace} />

      <div className="overview-dashboard">
        <OverviewSessionCard />
        <OverviewDatabaseCard
          onBrowseTables={onBrowseTables}
          onOpenWorkspace={onOpenWorkspace}
          onRunSql={onRunSql}
        />
      </div>

      <OverviewTablePreview onBrowseTable={onBrowseTable} onBrowseTables={onBrowseTables} />

      {(lastSnapshotAt || lastUpdatedAt) && (
        <footer className="overview-footer">
          {lastSnapshotAt && (
            <span title={formatTimestamp(lastSnapshotAt)}>
              Snapshot {formatRelativeTime(lastSnapshotAt)}
            </span>
          )}
          {lastSnapshotAt && lastUpdatedAt && <span className="overview-footer__sep">·</span>}
          {lastUpdatedAt && (
            <span title={formatTimestamp(lastUpdatedAt)}>
              Status {formatRelativeTime(lastUpdatedAt)}
            </span>
          )}
        </footer>
      )}
    </section>
  );
}
