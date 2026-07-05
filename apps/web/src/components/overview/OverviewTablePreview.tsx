import { useDevTools } from '../../context/DevToolsContext';

type OverviewTablePreviewProps = {
  onBrowseTable: (tableName: string) => void;
  onBrowseTables: () => void;
};

export function OverviewTablePreview({ onBrowseTable, onBrowseTables }: OverviewTablePreviewProps) {
  const { hasDatabase, tables } = useDevTools();

  if (!hasDatabase || tables.length === 0) {
    return null;
  }

  const preview = tables.slice(0, 8);

  return (
    <section className="overview-tables" aria-label="Table preview">
      <div className="overview-tables__header">
        <h3 className="overview-card__title">Tables</h3>
        {tables.length > preview.length && (
          <button type="button" className="overview-card__link" onClick={onBrowseTables}>
            View all {tables.length}
          </button>
        )}
      </div>

      <ul className="overview-tables__list">
        {preview.map((table) => (
          <li key={table.name}>
            <button
              type="button"
              className="overview-tables__item"
              onClick={() => onBrowseTable(table.name)}
            >
              <span className="overview-tables__name mono">{table.name}</span>
              <span className="overview-tables__count">
                {table.rowCount.toLocaleString()} row{table.rowCount === 1 ? '' : 's'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
