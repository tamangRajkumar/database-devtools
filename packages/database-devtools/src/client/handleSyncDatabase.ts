import type { DatabaseAdapter } from '../types/adapter';
import type { SyncDatabaseMessage } from '../types/protocol';
import { SNAPSHOT_KIND_HEADER, SNAPSHOT_MIME_HEADER } from '../types/snapshot';

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
      [SNAPSHOT_KIND_HEADER]: snapshot.kind,
      [SNAPSHOT_MIME_HEADER]: snapshot.mimeType,
    },
    body: new Blob([snapshot.bytes as BlobPart]),
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
}
