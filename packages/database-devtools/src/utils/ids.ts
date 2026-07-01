export function generateConnectionId(): string {
  return generateUniqueId('conn');
}

export function generateDeviceId(): string {
  return generateUniqueId('device');
}

export function generatePingId(): string {
  return generateUniqueId('ping');
}

export function generateSyncId(): string {
  return generateUniqueId('sync');
}

function generateUniqueId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
}
