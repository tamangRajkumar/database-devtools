import type { ConnectionState } from 'database-devtools/client';

type StatusBadgeProps = {
  state: ConnectionState;
  label?: string;
};

function getStatusLabel(state: ConnectionState): string {
  switch (state) {
    case 'connected':
      return 'Connected';
    case 'reconnecting':
      return 'Reconnecting';
    case 'connecting':
      return 'Connecting';
    case 'disconnected':
      return 'Disconnected';
  }
}

export function StatusBadge({ state, label }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-badge--${state}`}>
      <span className="status-badge__dot" aria-hidden />
      {label ?? getStatusLabel(state)}
    </span>
  );
}
