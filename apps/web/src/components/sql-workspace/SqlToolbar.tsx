import { useDevTools } from '../../context/DevToolsContext';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PlayIcon, HelpIcon } from '../icons/NavIcons';

export function SqlToolbar() {
  const { hasDatabase } = useDevTools();
  const { running, runQuery, openSaveDialog, formatActiveSql, clearActiveSql } = useSqlWorkspace();
  const { setShortcutsOpen } = useWorkspace();

  return (
    <div className="sql-toolbar">
      <div className="sql-toolbar__left">
        <button
          type="button"
          className="query-run-button"
          disabled={!hasDatabase || running}
          onClick={() => runQuery()}
          title={!hasDatabase ? 'Refresh to load database snapshot' : 'Run query (Ctrl+Enter)'}
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
        <button type="button" className="sql-toolbar__secondary" onClick={clearActiveSql}>
          Clear
        </button>
        <button type="button" className="sql-toolbar__secondary" onClick={openSaveDialog}>
          Save favorite
        </button>
        <span className="sql-toolbar__hint">Ctrl+Enter to run</span>
      </div>
      <div className="sql-toolbar__right">
        <button
          type="button"
          className="sql-toolbar__icon-button"
          aria-label="Keyboard shortcuts"
          onClick={() => setShortcutsOpen(true)}
        >
          <HelpIcon />
        </button>
        <span className="field-label__hint">Read-only: SELECT, PRAGMA, EXPLAIN, WITH</span>
      </div>
    </div>
  );
}
