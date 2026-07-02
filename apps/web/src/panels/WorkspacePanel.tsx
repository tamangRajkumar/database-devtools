import { useEffect, useRef } from 'react';
import { useDevTools } from '../context/DevToolsContext';
import { useSqlWorkspace } from '../context/SqlWorkspaceContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { SaveFavoriteDialog } from '../components/sql-workspace/SaveFavoriteDialog';
import { SqlEditor } from '../components/sql-workspace/SqlEditor';
import { SqlToolbar } from '../components/sql-workspace/SqlToolbar';
import { BottomPanel } from '../components/workspace/BottomPanel';
import { ObjectExplorer } from '../components/workspace/ObjectExplorer';
import { QueryTabs } from '../components/workspace/QueryTabs';
import { ResizeSplitter } from '../components/workspace/ResizeSplitter';
import { ShortcutsDialog } from '../components/workspace/ShortcutsDialog';
import { WorkspaceEmptyState } from '../components/workspace/WorkspaceEmptyState';
import { PanelLeftIcon } from '../components/icons/NavIcons';

export function WorkspacePanel() {
  const { selectedDevice, hasDatabase } = useDevTools();
  const { sql, setSql, runQuery, formatActiveSql } = useSqlWorkspace();
  const {
    objectExplorerOpen,
    toggleObjectExplorer,
    editorSplitRatio,
    setEditorSplitRatio,
    setShortcutsOpen,
  } = useWorkspace();
  const splitContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const target = event.target as HTMLElement | null;

        if (target?.closest('input, textarea, [contenteditable="true"], .cm-content')) {
          return;
        }

        event.preventDefault();
        setShortcutsOpen(true);
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
        const target = event.target as HTMLElement | null;

        if (target?.closest('.cm-editor')) {
          event.preventDefault();
          formatActiveSql();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formatActiveSql, setShortcutsOpen]);

  if (!selectedDevice) {
    return (
      <section className="panel panel--workspace">
        <WorkspaceEmptyState />
      </section>
    );
  }

  return (
    <section className="panel panel--workspace">
      <ShortcutsDialog />
      <SaveFavoriteDialog />

      <div className={`workspace ${objectExplorerOpen ? '' : 'workspace--explorer-collapsed'}`}>
        {objectExplorerOpen && (
          <aside className="workspace__explorer">
            <ObjectExplorer />
          </aside>
        )}

        <div className="workspace__main">
          <div className="workspace__main-header">
            <button
              type="button"
              className="workspace__toggle-explorer"
              aria-label={objectExplorerOpen ? 'Hide Object Explorer' : 'Show Object Explorer'}
              aria-pressed={objectExplorerOpen}
              onClick={toggleObjectExplorer}
            >
              <PanelLeftIcon />
            </button>
            <QueryTabs />
          </div>

          <WorkspaceEmptyState />

          <div className="workspace__editor-area" ref={splitContainerRef}>
            <div className="workspace__editor-pane" style={{ flexBasis: `${editorSplitRatio * 100}%` }}>
              <SqlToolbar />
              <SqlEditor
                value={sql}
                onChange={setSql}
                onRun={runQuery}
                disabled={!hasDatabase}
              />
            </div>

            <ResizeSplitter
              containerRef={splitContainerRef}
              onResize={setEditorSplitRatio}
            />

            <div className="workspace__results-pane" style={{ flexBasis: `${(1 - editorSplitRatio) * 100}%` }}>
              <BottomPanel />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
