import { useMemo, useState, type MouseEvent } from 'react';
import { filterTables } from '@database-devtools/inspector-sqlite';
import { useDevTools } from '../../context/DevToolsContext';
import { useExplorer } from '../../context/ExplorerContext';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { RefreshButton } from '../RefreshButton';
import { resolveDeviceLabel, shortenDeviceId } from 'database-devtools/client';
import {
  ChevronIcon,
  DatabaseIcon,
  SmartphoneIcon,
  TableIcon,
} from '../icons/NavIcons';

function buildSelectTop100(tableName: string): string {
  return `SELECT * FROM "${tableName.replace(/"/g, '""')}"\nLIMIT 100;`;
}

type ContextMenuState = {
  tableName: string;
  x: number;
  y: number;
};

export function ObjectExplorer() {
  const { selectedDevice, deviceStatus, hasDatabase, tables, snapshotMeta } = useDevTools();
  const { selectedTable, setSelectedTable, setView } = useExplorer();
  const { insertSql, insertSqlAndRun } = useSqlWorkspace();
  const { setBottomPanelTab } = useWorkspace();
  const [search, setSearch] = useState('');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const filteredTables = useMemo(
    () => filterTables(tables, search),
    [tables, search],
  );

  if (!selectedDevice) {
    return (
      <div className="object-explorer object-explorer--empty">
        <p>Select a connected device to explore its database.</p>
      </div>
    );
  }

  const label = resolveDeviceLabel(selectedDevice.deviceId, deviceStatus);
  const deviceTitle = `${label.deviceName} (${shortenDeviceId(label.deviceId)})`;
  const databaseName = snapshotMeta?.databaseName ?? snapshotMeta?.kind ?? 'sqlite';

  const handleBrowseData = (tableName: string) => {
    setSelectedTable(tableName);
    setView('data');
    setBottomPanelTab('data');
    setContextMenu(null);
  };

  const handleViewSchema = (tableName: string) => {
    setSelectedTable(tableName);
    setView('schema');
    setBottomPanelTab('data');
    setContextMenu(null);
  };

  const handleSelectTop100 = (tableName: string, autoRun = false) => {
    const sql = buildSelectTop100(tableName);

    if (autoRun) {
      insertSqlAndRun(sql);
    } else {
      insertSql(sql);
      setBottomPanelTab('results');
    }

    setContextMenu(null);
  };

  const openContextMenu = (event: MouseEvent, tableName: string) => {
    event.preventDefault();
    setContextMenu({ tableName, x: event.clientX, y: event.clientY });
  };

  return (
    <div className="object-explorer" role="tree" aria-label="Object Explorer">
      <div className="object-explorer__header">
        <h2 className="object-explorer__title">Object Explorer</h2>
        {hasDatabase && (
          <input
            type="search"
            className="explorer-search"
            placeholder="Filter tables…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Filter tables"
          />
        )}
      </div>

      <div className="object-explorer__tree">
        <details className="object-explorer__node" open>
          <summary className="object-explorer__summary">
            <ChevronIcon expanded />
            <SmartphoneIcon />
            <span className="object-explorer__label">{deviceTitle}</span>
          </summary>

          {!hasDatabase ? (
            <div className="object-explorer__hint-block">
              <p className="object-explorer__hint">Refresh to load database objects.</p>
              <RefreshButton />
            </div>
          ) : (
            <details className="object-explorer__node object-explorer__node--nested" open>
              <summary className="object-explorer__summary">
                <ChevronIcon expanded />
                <DatabaseIcon />
                <span className="object-explorer__label">{databaseName}</span>
              </summary>

              <details className="object-explorer__node object-explorer__node--nested" open>
                <summary className="object-explorer__summary">
                  <ChevronIcon expanded />
                  <span className="object-explorer__label">Tables</span>
                  <span className="object-explorer__count">{filteredTables.length}</span>
                </summary>

                {filteredTables.length === 0 ? (
                  <p className="object-explorer__hint">No tables match your search.</p>
                ) : (
                  <ul className="object-explorer__list" role="group">
                    {filteredTables.map((table) => (
                      <li
                        key={table.name}
                        className={`object-explorer__table ${selectedTable === table.name ? 'object-explorer__table--active' : ''}`}
                        role="treeitem"
                      >
                        <button
                          type="button"
                          className="object-explorer__table-row"
                          onClick={() => handleBrowseData(table.name)}
                          onDoubleClick={() => handleSelectTop100(table.name, true)}
                          onContextMenu={(event) => openContextMenu(event, table.name)}
                        >
                          <TableIcon />
                          <span className="object-explorer__table-name mono">{table.name}</span>
                          <span className="object-explorer__count">{table.rowCount}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </details>
          )}
        </details>
      </div>

      {contextMenu && (
        <>
          <button
            type="button"
            className="object-explorer__menu-backdrop"
            aria-label="Close table menu"
            onClick={() => setContextMenu(null)}
          />
          <menu
            className="object-explorer__menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button type="button" onClick={() => handleSelectTop100(contextMenu.tableName, true)}>
              SELECT TOP 100 & Run
            </button>
            <button type="button" onClick={() => handleSelectTop100(contextMenu.tableName)}>
              SELECT TOP 100
            </button>
            <button type="button" onClick={() => handleBrowseData(contextMenu.tableName)}>
              Browse data
            </button>
            <button type="button" onClick={() => handleViewSchema(contextMenu.tableName)}>
              View schema
            </button>
          </menu>
        </>
      )}
    </div>
  );
}
