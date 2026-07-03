import type { ConnectionState } from 'database-devtools/client';
import { useDevTools } from '../../context/DevToolsContext';
import { StatusBadge } from '../StatusBadge';

export type SessionStatus =
  | 'hub-offline'
  | 'device-online'
  | 'offline-export'
  | 'offline-export-live-available'
  | 'waiting';

export function resolveSessionStatus(input: {
  hubState: ConnectionState;
  isDeviceLive: boolean;
  hasDatabase: boolean;
  hasLiveMobileAvailable: boolean;
}): SessionStatus {
  if (input.hubState !== 'connected') {
    return 'hub-offline';
  }

  if (input.isDeviceLive) {
    return 'device-online';
  }

  if (input.hasDatabase && input.hasLiveMobileAvailable) {
    return 'offline-export-live-available';
  }

  if (input.hasDatabase) {
    return 'offline-export';
  }

  return 'waiting';
}

export function OverviewSessionBadge() {
  const { connectionState, isDeviceLive, hasDatabase, hasLiveMobileAvailable } = useDevTools();
  const sessionStatus = resolveSessionStatus({
    hubState: connectionState,
    isDeviceLive,
    hasDatabase,
    hasLiveMobileAvailable,
  });

  switch (sessionStatus) {
    case 'hub-offline':
      return <StatusBadge state={connectionState} label="Hub offline" />;
    case 'device-online':
      return <StatusBadge state="connected" label="Device online" />;
    case 'offline-export-live-available':
      return <span className="status-badge status-badge--live-available">Live device available</span>;
    case 'offline-export':
      return <span className="status-badge status-badge--offline">Offline export</span>;
    default:
      return <StatusBadge state="connecting" label="Waiting for device" />;
  }
}
