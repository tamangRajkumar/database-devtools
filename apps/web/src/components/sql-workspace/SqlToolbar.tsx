import type { RefObject } from 'react';
import { useDevTools } from '../../context/DevToolsContext';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
// import { useWorkspace } from '../../context/WorkspaceContext';
import { PlayIcon, HelpIcon } from '../icons/NavIcons';
import type { SqlEditorHandle } from './SqlEditor';

type SqlToolbarProps = {
  editorRef: RefObject<SqlEditorHandle | null>;
};

export function SqlToolbar({ editorRef }: SqlToolbarProps) {
  const { hasDatabase } = useDevTools();
  const { running, runQuery, openSaveDialog, formatActiveSql, clearActiveSql } = useSqlWorkspace();
  // const { setShortcutsOpen } = useWorkspace();

  const handleRun = () => {
    const sqlToRun = editorRef.current?.getSqlToRun();
    runQuery(sqlToRun);
  };

  return (
    <div className="sql-toolbar">
      <div className="sql-toolbar__left">
        <button
          type="button"
          className="query-run-button"
          disabled={!hasDatabase || running}
          onClick={handleRun}
          title={!hasDatabase ? 'Refresh to load database snapshot' : 'Run query or selection (Ctrl+Enter)'}
        >
          <PlayIcon />
          {running ? 'Running…' : 'Run'}
        </button>
        <button
          type="button"
          className="sql-toolbar__secondary"
          disabled={!hasDatabase}
          onClick={formatActiveSql}
          title="Format SQL (Ctrl+Shift+F)"
        >
          Format
        </button>
        <button
          type="button"
          className="sql-toolbar__secondary"
          onClick={clearActiveSql}
          title="Clear the editor"
        >
          Clear
        </button>
        <button
          type="button"
          className="sql-toolbar__secondary"
          onClick={openSaveDialog}
          title="Save current query as a favorite"
        >
          Save favorite
        </button>
        <span className="sql-toolbar__hint">Ctrl+Enter to run selection or all</span>
      </div>
      <div className="sql-toolbar__right">
        {/* <button
          type="button"
          className="sql-toolbar__icon-button"
          aria-label="Keyboard shortcuts"
          onClick={() => setShortcutsOpen(true)}
        >
          <HelpIcon />
        </button> */}
        <span className="field-label__hint">Read-only
          {/* : SELECT, PRAGMA, EXPLAIN, WITHs */}
          </span>
      </div>
    </div>
  );
}
