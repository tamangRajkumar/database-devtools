import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { HistoryList } from './HistoryList';
import { FavoritesList } from './FavoritesList';

export function QuerySidebar() {
  const { sidebarTab, setSidebarTab } = useSqlWorkspace();

  return (
    <aside className="sql-sidebar">
      <div className="explorer-tabs sql-sidebar__tabs" role="tablist" aria-label="Query lists">
        <button
          type="button"
          role="tab"
          aria-selected={sidebarTab === 'history'}
          className={`explorer-tabs__item ${sidebarTab === 'history' ? 'explorer-tabs__item--active' : ''}`}
          onClick={() => setSidebarTab('history')}
        >
          History
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={sidebarTab === 'favorites'}
          className={`explorer-tabs__item ${sidebarTab === 'favorites' ? 'explorer-tabs__item--active' : ''}`}
          onClick={() => setSidebarTab('favorites')}
        >
          Favorites
        </button>
      </div>
      <div className="sql-sidebar__content">
        {sidebarTab === 'history' ? <HistoryList /> : <FavoritesList />}
      </div>
    </aside>
  );
}
