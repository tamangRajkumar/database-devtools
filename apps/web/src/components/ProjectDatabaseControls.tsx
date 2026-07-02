import { useDevTools } from '../context/DevToolsContext';

export function ProjectDatabaseControls() {
  const {
    connectionState,
    databaseSource,
    projectDatabaseAvailable,
    projectLoadState,
    loadProjectDatabase,
    reloadProjectDatabase,
    projectLoadError,
  } = useDevTools();

  const hubConnected = connectionState === 'connected';
  const loading = projectLoadState === 'loading';
  const showReload = databaseSource === 'project' && hubConnected;

  return (
    <div className="refresh-control project-database-controls">
      {!showReload && (
        <button
          type="button"
          className="refresh-button refresh-button--secondary"
          disabled={!hubConnected || loading || !projectDatabaseAvailable}
          onClick={() => void loadProjectDatabase()}
          title={
            projectDatabaseAvailable
              ? 'Load .devtools/databases/active.db from disk'
              : 'No project database on disk yet'
          }
        >
          {loading ? 'Loading…' : 'Load project'}
        </button>
      )}
      {showReload && (
        <button
          type="button"
          className="refresh-button refresh-button--secondary"
          disabled={loading}
          onClick={() => void reloadProjectDatabase()}
          title="Reload active.db from disk (e.g. after editing in DB Browser)"
        >
          {loading ? 'Reloading…' : 'Reload disk'}
        </button>
      )}
      {projectLoadError && (
        <span className="refresh-control__error" role="alert" title={projectLoadError}>
          {projectLoadError.length > 40 ? `${projectLoadError.slice(0, 40)}…` : projectLoadError}
        </span>
      )}
    </div>
  );
}
