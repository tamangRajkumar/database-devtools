import { useExplorer } from '../../context/ExplorerContext';

export function TableListSidebar() {
  const {
    filteredTables,
    selectedTable,
    setSelectedTable,
    tableSearch,
    setTableSearch,
    tableSort,
    setTableSort,
    tableSortDir,
    toggleTableSortDir,
  } = useExplorer();

  return (
    <aside className="explorer-sidebar">
      <div className="explorer-sidebar__header">
        <h2 className="explorer-sidebar__title">Tables</h2>
        <div className="explorer-sidebar__controls">
          <select
            className="explorer-select"
            value={tableSort}
            onChange={(event) => setTableSort(event.target.value as 'name' | 'rows')}
            aria-label="Sort tables by"
          >
            <option value="name">Name</option>
            <option value="rows">Rows</option>
          </select>
          <button
            type="button"
            className="explorer-icon-button"
            onClick={toggleTableSortDir}
            aria-label={`Sort ${tableSortDir === 'asc' ? 'descending' : 'ascending'}`}
          >
            {tableSortDir === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <input
        type="search"
        className="explorer-search"
        placeholder="Filter tables…"
        value={tableSearch}
        onChange={(event) => setTableSearch(event.target.value)}
        aria-label="Filter tables"
      />

      <ul className="explorer-table-list">
        {filteredTables.map((table) => (
          <li key={table.name}>
            <button
              type="button"
              className={`explorer-table-list__item ${
                selectedTable === table.name ? 'explorer-table-list__item--active' : ''
              }`}
              onClick={() => setSelectedTable(table.name)}
            >
              <span className="explorer-table-list__name mono">{table.name}</span>
              <span className="explorer-table-list__count">{table.rowCount.toLocaleString()}</span>
            </button>
          </li>
        ))}
      </ul>

      {filteredTables.length === 0 && (
        <p className="explorer-sidebar__empty">No tables match your filter.</p>
      )}
    </aside>
  );
}
