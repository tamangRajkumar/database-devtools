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
  const { selectedDevice, lastSnapshotAt, lastUpdatedAt } = useDevTools();

  if (!selectedDevice) {
    return (
      <section className="panel panel--overview panel--overview-empty">
        <div className="overview-empty">
          <h2 className="overview-empty__title">No device connected</h2>
          <p className="overview-empty__text">
            Run your mobile app with Database DevTools enabled, then start the hub on your machine.
          </p>
          <ol className="overview-empty__steps">
            <li>
              In <code className="mono">database-devtools</code>, run{' '}
              <code className="mono">pnpm dev:cli</code>
            </li>
            <li>Start the example app with <code className="mono">pnpm dev:example</code></li>
            <li>Select the device in the toolbar above</li>
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
