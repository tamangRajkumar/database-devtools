import { useExplorer } from '../../context/ExplorerContext';

export function SchemaView() {
  const { selectedTable, tableColumns } = useExplorer();

  if (!selectedTable) {
    return (
      <div className="explorer-empty">
        <p>Select a table to view schema.</p>
      </div>
    );
  }

  if (tableColumns.length === 0) {
    return (
      <div className="explorer-empty">
        <p>No schema information for this table.</p>
      </div>
    );
  }

  return (
    <div className="schema-tree schema-view">
      <details className="schema-tree__table" open>
        <summary className="schema-tree__summary mono">{selectedTable}</summary>
        <ul className="schema-tree__columns">
          {tableColumns.map((column) => (
            <li key={column.name} className="schema-tree__column">
              <span className="mono">{column.name}</span>
              <span className="schema-tree__type">{column.type}</span>
              {column.pk && <span className="schema-tree__badge">PK</span>}
              {column.notNull && <span className="schema-tree__badge">NOT NULL</span>}
              {column.defaultValue !== null && (
                <span className="schema-tree__default mono">default {column.defaultValue}</span>
              )}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
