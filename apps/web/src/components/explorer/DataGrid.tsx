import { useExplorer, type ExplorerRow } from '../../context/ExplorerContext';

type SortableColumnHeaderProps = {
  column: string;
};

export function SortableColumnHeader({ column }: SortableColumnHeaderProps) {
  const { sortColumn, sortDir, toggleSort } = useExplorer();
  const isActive = sortColumn === column;

  return (
    <button
      type="button"
      className={`data-grid__sort ${isActive ? 'data-grid__sort--active' : ''}`}
      onClick={() => toggleSort(column)}
    >
      <span>{column}</span>
      {isActive && <span className="data-grid__sort-indicator">{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );
}

export function DataGrid() {
  const { tablePage, setSelectedRow, page, pageSize } = useExplorer();

  if (!tablePage) {
    return (
      <div className="explorer-empty">
        <p>Select a table to view rows.</p>
      </div>
    );
  }

  if (tablePage.columns.length === 0) {
    return (
      <div className="explorer-empty">
        <p>This table has no columns.</p>
      </div>
    );
  }

  if (tablePage.rows.length === 0) {
    return (
      <div className="explorer-empty">
        <p>No rows match your search.</p>
      </div>
    );
  }

  const handleRowClick = (row: (string | number | null)[], index: number) => {
    const values: Record<string, string | number | null> = {};

    tablePage.columns.forEach((column, columnIndex) => {
      values[column] = row[columnIndex] ?? null;
    });

    const explorerRow: ExplorerRow = {
      index: (page - 1) * pageSize + index,
      values,
    };

    setSelectedRow(explorerRow);
  };

  return (
    <div className="data-table-wrapper data-grid">
      <table className="data-table">
        <thead>
          <tr>
            {tablePage.columns.map((column) => (
              <th key={column}>
                <SortableColumnHeader column={column} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tablePage.rows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="data-grid__row"
              onClick={() => handleRowClick(row, rowIndex)}
            >
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell === null ? <span className="data-grid__null">NULL</span> : String(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
