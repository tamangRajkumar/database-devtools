import { useDevTools } from '../../context/DevToolsContext';
import { useExplorer } from '../../context/ExplorerContext';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { useWorkspace } from '../../context/WorkspaceContext';
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

export function ObjectExplorer() {
  const { selectedDevice, deviceStatus, hasDatabase, tables, snapshotMeta } = useDevTools();
  const { setSelectedTable, setView } = useExplorer();
  const { insertSql } = useSqlWorkspace();
  const { setBottomPanelTab } = useWorkspace();

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

  const handleSelectTop100 = (tableName: string) => {
    insertSql(buildSelectTop100(tableName));
    setBottomPanelTab('results');
  };

  const handleBrowseData = (tableName: string) => {
    setSelectedTable(tableName);
    setView('data');
    setBottomPanelTab('data');
  };

  const handleViewSchema = (tableName: string) => {
    setSelectedTable(tableName);
    setView('schema');
    setBottomPanelTab('schema');
  };

  return (
    <div className="object-explorer" role="tree" aria-label="Object Explorer">
      <div className="object-explorer__header">
        <h2 className="object-explorer__title">Object Explorer</h2>
      </div>

      <div className="object-explorer__tree">
        <details className="object-explorer__node" open>
          <summary className="object-explorer__summary">
            <ChevronIcon expanded />
            <SmartphoneIcon />
            <span className="object-explorer__label">{deviceTitle}</span>
          </summary>

          {!hasDatabase ? (
            <p className="object-explorer__hint">Refresh to load database objects.</p>
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
                  <span className="object-explorer__count">{tables.length}</span>
                </summary>

                {tables.length === 0 ? (
                  <p className="object-explorer__hint">No user tables found.</p>
                ) : (
                  <ul className="object-explorer__list" role="group">
                    {tables.map((table) => (
                      <li key={table.name} className="object-explorer__table" role="treeitem">
                        <div className="object-explorer__table-row">
                          <TableIcon />
                          <span className="object-explorer__table-name mono">{table.name}</span>
                          <span className="object-explorer__count">{table.rowCount}</span>
                        </div>
                        <div className="object-explorer__actions">
                          <button
                            type="button"
                            className="object-explorer__action"
                            onClick={() => handleSelectTop100(table.name)}
                          >
                            SELECT TOP 100
                          </button>
                          <button
                            type="button"
                            className="object-explorer__action"
                            onClick={() => handleBrowseData(table.name)}
                          >
                            Browse
                          </button>
                          <button
                            type="button"
                            className="object-explorer__action"
                            onClick={() => handleViewSchema(table.name)}
                          >
                            Schema
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            </details>
          )}
        </details>
      </div>
    </div>
  );
}
