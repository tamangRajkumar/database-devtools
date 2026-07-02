import { useDevTools } from '../../context/DevToolsContext';

export function ConnectionHelpBanner() {
  const { connectionState, refreshError } = useDevTools();

  if (connectionState === 'connected' && !refreshError) {
    return null;
  }

  return (
    <div className="connection-help" role="status">
      {connectionState !== 'connected' && (
        <p className="connection-help__text">
          Hub disconnected. Start the CLI with <code className="mono">pnpm dev:cli</code> in the
          database-devtools folder.
        </p>
      )}
      {refreshError && (
        <p className="connection-help__text connection-help__text--error">{refreshError}</p>
      )}
    </div>
  );
}
