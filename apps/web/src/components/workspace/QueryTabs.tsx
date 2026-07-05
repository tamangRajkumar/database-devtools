import { useState } from 'react';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { CloseIcon, PlusIcon } from '../icons/NavIcons';

export function QueryTabs() {
  const { tabs, activeTabId, switchTab, createTab, closeTab, renameTab } = useSqlWorkspace();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = (id: string, title: string) => {
    setRenamingId(id);
    setRenameValue(title);
  };

  const commitRename = () => {
    if (renamingId) {
      renameTab(renamingId, renameValue);
    }

    setRenamingId(null);
    setRenameValue('');
  };

  return (
    <div className="query-tabs" role="tablist" aria-label="Query tabs">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const isRenaming = renamingId === tab.id;

        return (
          <div key={tab.id} className={`query-tabs__tab ${isActive ? 'query-tabs__tab--active' : ''}`}>
            {isRenaming ? (
              <input
                className="query-tabs__rename"
                value={renameValue}
                autoFocus
                onChange={(event) => setRenameValue(event.target.value)}
                onBlur={commitRename}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    commitRename();
                  }

                  if (event.key === 'Escape') {
                    setRenamingId(null);
                  }
                }}
              />
            ) : (
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                className="query-tabs__button"
                title={tab.sql.trim().split('\n')[0] ?? tab.title}
                onClick={() => switchTab(tab.id)}
                onDoubleClick={() => startRename(tab.id, tab.title)}
              >
                {tab.title}
                {tab.dirty ? '*' : ''}
              </button>
            )}
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
