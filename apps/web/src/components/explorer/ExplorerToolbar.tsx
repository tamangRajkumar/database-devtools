import { useState } from 'react';
import { useEditMode } from '../../context/EditModeContext';
import { useExplorer } from '../../context/ExplorerContext';
import { InsertRowDialog } from './InsertRowDialog';

type ExplorerToolbarProps = {
  embedded?: boolean;
};

export function ExplorerToolbar({ embedded = false }: ExplorerToolbarProps) {
  const {
    selectedTable,
    view,
    setView,
    tablePage,
    rowSearch,
    setRowSearch,
  } = useExplorer();
  const { editMode, transactionOpen } = useEditMode();
  const [insertOpen, setInsertOpen] = useState(false);

  if (!selectedTable) {
    return null;
  }

  return (
    <div className={`explorer-toolbar ${embedded ? 'explorer-toolbar--embedded' : ''}`}>
      <div className="explorer-toolbar__left">
        <h2 className="explorer-toolbar__title mono">{selectedTable}</h2>
        {tablePage && (
          <span className="explorer-toolbar__meta">
            {tablePage.totalCount.toLocaleString()} row{tablePage.totalCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="explorer-toolbar__center">
        <div className="explorer-tabs" role="tablist" aria-label="Table views">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'data'}
            className={`explorer-tabs__item ${view === 'data' ? 'explorer-tabs__item--active' : ''}`}
            onClick={() => setView('data')}
            title="Browse table rows"
          >
            Data
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'schema'}
            className={`explorer-tabs__item ${view === 'schema' ? 'explorer-tabs__item--active' : ''}`}
            onClick={() => setView('schema')}
            title="View table schema"
          >
            Schema
          </button>
        </div>
      </div>

      <div className="explorer-toolbar__right">
        {view === 'data' && editMode && transactionOpen && (
          <button
            type="button"
            className="button button--ghost explorer-toolbar__insert"
            onClick={() => setInsertOpen(true)}
          >
            + Insert row
          </button>
        )}
        {view === 'data' && (
          <input
            type="search"
            className="explorer-search explorer-search--compact"
            placeholder="Search rows…"
            value={rowSearch}
            onChange={(event) => setRowSearch(event.target.value)}
            aria-label="Search rows"
          />
        )}
      </div>
      {insertOpen && <InsertRowDialog onClose={() => setInsertOpen(false)} />}
    </div>
  );
}
