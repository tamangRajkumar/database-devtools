import { DeviceSelector } from '../DeviceSelector';
import { ProjectDatabaseControls } from '../ProjectDatabaseControls';
import { RefreshButton } from '../RefreshButton';
import { StatusBadge } from '../StatusBadge';
import { ThemeToggle } from '../ThemeToggle';
import { ActivityIndicator } from './ActivityIndicator';
import { useDevTools } from '../../context/DevToolsContext';

type TopBarProps = {
  onMenuToggle: () => void;
  menuExpanded?: boolean;
};

export function TopBar({ onMenuToggle, menuExpanded = false }: TopBarProps) {
  const { connectionState, refreshError } = useDevTools();
  const hubOffline = connectionState !== 'connected';

  return (
    <div className="top-bar">
      <div className="top-bar__left">
        <button
          type="button"
          className="top-bar__menu-button"
          onClick={onMenuToggle}
          aria-expanded={menuExpanded}
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="top-bar__brand">
          <span className="top-bar__logo" aria-hidden>
            DB
          </span>
          <h1 className="top-bar__title">Database DevTools</h1>
        </div>
      </div>

      <div className="top-bar__center">
        <DeviceSelector />
      </div>

      <div className="top-bar__right">
        {hubOffline && (
          <span
            className="top-bar__hub-chip"
            title="Start the CLI with pnpm dev:cli in the database-devtools folder"
          >
            Hub offline
          </span>
        )}
        {refreshError && !hubOffline && (
          <span className="top-bar__hub-chip top-bar__hub-chip--error" title={refreshError}>
            Refresh failed
          </span>
        )}
        <ActivityIndicator />
        <ProjectDatabaseControls />
        <RefreshButton />
        <StatusBadge state={connectionState} label={`Hub ${connectionState}`} />
        <ThemeToggle />
      </div>
    </div>
  );
}
