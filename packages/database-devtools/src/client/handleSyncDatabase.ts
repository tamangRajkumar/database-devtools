import type { DatabaseAdapter } from '../types/adapter';
import type { SyncDatabaseMessage } from '../types/protocol';

export async function handleSyncDatabase(
  database: DatabaseAdapter | undefined,
  message: SyncDatabaseMessage,
): Promise<void> {
  if (!database) {
    throw new Error('No database adapter configured');
  }

  const snapshot = await database.exportSnapshot();

  const response = await fetch(message.uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: new Blob([snapshot as BlobPart]),
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
}
