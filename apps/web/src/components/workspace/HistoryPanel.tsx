import { useState } from 'react';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { HistoryList } from '../sql-workspace/HistoryList';
import { FavoritesList } from '../sql-workspace/FavoritesList';

export function HistoryPanel() {
  const [tab, setTab] = useState<'history' | 'favorites'>('history');

  return (
    <div className="history-panel">
      <div className="explorer-tabs history-panel__tabs" role="tablist" aria-label="Saved queries">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'history'}
          className={`explorer-tabs__item ${tab === 'history' ? 'explorer-tabs__item--active' : ''}`}
          onClick={() => setTab('history')}
        >
          History
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'favorites'}
          className={`explorer-tabs__item ${tab === 'favorites' ? 'explorer-tabs__item--active' : ''}`}
          onClick={() => setTab('favorites')}
        >
          Favorites
        </button>
      </div>
      <div className="history-panel__content">
        {tab === 'history' ? <HistoryList /> : <FavoritesList />}
      </div>
    </div>
  );
}
