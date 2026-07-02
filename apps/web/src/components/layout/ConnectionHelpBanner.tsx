import { useDevTools } from '../../context/DevToolsContext';

/** Full-width banner for refresh errors only; hub status lives in the top bar. */
export function ConnectionHelpBanner() {
  const { refreshError, connectionState } = useDevTools();

  if (!refreshError || connectionState !== 'connected') {
    return null;
  }

  return (
    <div className="connection-help" role="status">
      <p className="connection-help__text connection-help__text--error">{refreshError}</p>
    </div>
  );
}
