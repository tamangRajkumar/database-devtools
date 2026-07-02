import { useDevTools } from '../../context/DevToolsContext';
import { formatRelativeTime } from '../../lib/formatRelativeTime';

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

type OverviewDatabaseCardProps = {
  onOpenWorkspace: () => void;
  onRunSql: () => void;
  onBrowseTables: () => void;
};

export function OverviewDatabaseCard({
  onOpenWorkspace,
  onRunSql,
  onBrowseTables,
}: OverviewDatabaseCardProps) {
  const { hasDatabase, tables, snapshotMeta } = useDevTools();

  if (!hasDatabase || !snapshotMeta) {
    return (
      <article className="overview-card overview-card--placeholder">
        <h3 className="overview-card__title">SQLite database</h3>
        <p className="overview-card__placeholder-title">No snapshot loaded</p>
        <p className="overview-card__placeholder-text">
          Use Refresh in the status card above to pull a read-only copy from the device.
        </p>
      </article>
    );
  }

  return (
    <article className="overview-card">
      <h3 className="overview-card__title">SQLite database</h3>

      <dl className="overview-stats">
        <div className="overview-stats__row">
          <dt>Database</dt>
          <dd>{snapshotMeta.databaseName ?? snapshotMeta.kind}</dd>
        </div>
        <div className="overview-stats__row">
          <dt>Tables</dt>
          <dd>{tables.length}</dd>
        </div>
        <div className="overview-stats__row">
          <dt>Size</dt>
          <dd>{formatBytes(snapshotMeta.size)}</dd>
        </div>
        <div className="overview-stats__row">
          <dt>Refreshed</dt>
          <dd title={formatTimestamp(snapshotMeta.exportedAt)}>
            {formatRelativeTime(snapshotMeta.exportedAt)}
          </dd>
        </div>
        <div className="overview-stats__row">
          <dt>Dialect</dt>
          <dd>sqlite</dd>
        </div>
      </dl>

      <div className="overview-card__links">
        <button type="button" className="overview-card__link" onClick={onOpenWorkspace}>
          Open workspace
        </button>
        <button type="button" className="overview-card__link" onClick={onBrowseTables}>
          Browse tables
        </button>
        <button type="button" className="overview-card__link" onClick={onRunSql}>
          Run SQL
        </button>
      </div>
    </article>
  );
}
