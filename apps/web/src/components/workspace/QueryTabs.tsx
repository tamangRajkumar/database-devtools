import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { CloseIcon, PlusIcon } from '../icons/NavIcons';

export function QueryTabs() {
  const { tabs, activeTabId, switchTab, createTab, closeTab } = useSqlWorkspace();

  return (
    <div className="query-tabs" role="tablist" aria-label="Query tabs">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <div key={tab.id} className={`query-tabs__tab ${isActive ? 'query-tabs__tab--active' : ''}`}>
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              className="query-tabs__button"
              onClick={() => switchTab(tab.id)}
            >
              {tab.title}
              {tab.dirty ? '*' : ''}
            </button>
            {tabs.length > 1 && (
              <button
                type="button"
                className="query-tabs__close"
                aria-label={`Close ${tab.title}`}
                onClick={() => closeTab(tab.id)}
              >
                <CloseIcon size={12} />
              </button>
            )}
          </div>
        );
      })}
      <button type="button" className="query-tabs__add" aria-label="New query tab" onClick={createTab}>
        <PlusIcon />
      </button>
    </div>
  );
}
