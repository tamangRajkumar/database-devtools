import { useMemo, useState } from 'react';

type QueryResultsGridProps = {
  columns: string[];
  rows: (string | number | null)[][];
};

type SortState = {
  column: string | null;
  direction: 'asc' | 'desc';
};

function compareValues(a: string | number | null, b: string | number | null): number {
  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  return String(a).localeCompare(String(b));
}

export function QueryResultsGrid({ columns, rows }: QueryResultsGridProps) {
  const [sort, setSort] = useState<SortState>({ column: null, direction: 'asc' });
  const [copiedCell, setCopiedCell] = useState<string | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort.column) {
      return rows;
    }

    const columnIndex = columns.indexOf(sort.column);

    if (columnIndex < 0) {
      return rows;
    }

    return [...rows].sort((left, right) => {
      const result = compareValues(left[columnIndex] ?? null, right[columnIndex] ?? null);
      return sort.direction === 'asc' ? result : -result;
    });
  }, [columns, rows, sort.column, sort.direction]);

  const toggleSort = (column: string) => {
    setSort((current) => {
      if (current.column !== column) {
        return { column, direction: 'asc' };
      }

      if (current.direction === 'asc') {
        return { column, direction: 'desc' };
      }

      return { column: null, direction: 'asc' };
    });
  };

  const copyCell = async (value: string | number | null, key: string) => {
    const text = value === null ? 'NULL' : String(value);
    await navigator.clipboard.writeText(text);
    setCopiedCell(key);
    window.setTimeout(() => setCopiedCell(null), 1500);
  };

  return (
    <div className="query-results-grid">
      <p className="query-results-grid__meta">
        Showing {sortedRows.length} row{sortedRows.length === 1 ? '' : 's'}
        {copiedCell ? ' · Copied' : ' · Click a cell to copy'}
      </p>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>
                  <button
                    type="button"
                    className={`data-grid__sort ${sort.column === column ? 'data-grid__sort--active' : ''}`}
                    onClick={() => toggleSort(column)}
                  >
                    <span>{column}</span>
                    {sort.column === column && (
                      <span className="data-grid__sort-indicator">
                        {sort.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => {
                  const cellKey = `${rowIndex}-${cellIndex}`;

                  return (
                    <td key={cellKey}>
                      <button
                        type="button"
                        className="query-results-grid__cell"
                        onClick={() => void copyCell(cell, cellKey)}
                      >
                        {cell === null ? (
                          <span className="data-grid__null">NULL</span>
                        ) : (
                          String(cell)
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
