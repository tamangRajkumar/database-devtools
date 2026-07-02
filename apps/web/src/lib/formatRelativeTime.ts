export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const deltaMs = now - timestamp;
  const deltaSeconds = Math.round(deltaMs / 1000);

  if (deltaSeconds < 10) {
    return 'just now';
  }

  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  const deltaMinutes = Math.round(deltaSeconds / 60);

  if (deltaMinutes < 60) {
    return `${deltaMinutes}m ago`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);

  if (deltaHours < 48) {
    return `${deltaHours}h ago`;
  }

  return new Date(timestamp).toLocaleString();
}
