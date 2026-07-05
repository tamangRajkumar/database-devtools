import type { DatabaseAdapter } from '../types/adapter';
import {
  buildDeviceSnapshotUrl,
  wsUrlToHttpUrl,
  type SnapshotUploadRequestedMessage,
} from '../types/protocol';
import { SNAPSHOT_KIND_HEADER, SNAPSHOT_MIME_HEADER, SNAPSHOT_NAME_HEADER } from '../types/snapshot';
import { uploadSnapshot } from './snapshotUpload';

export type HandleDeviceSnapshotOptions = {
  /** WebSocket URL of the connected hub — used to build the upload URL on mobile. */
  hubServerUrl?: string;
  /** This mobile client's device ID — upload is ignored when it does not match. */
  deviceId?: string;
};

export async function handleDeviceSnapshotUpload(
  database: DatabaseAdapter | undefined,
  message: SnapshotUploadRequestedMessage,
  options: HandleDeviceSnapshotOptions = {},
): Promise<void> {
  if (options.deviceId && message.deviceId !== options.deviceId) {
    return;
  }

  if (!database) {
    throw new Error('No database adapter configured');
  }

  if (!options.hubServerUrl) {
    throw new Error('hubServerUrl is required to upload a device snapshot');
  }

  const snapshot = await database.exportSnapshot();
  const hubHttp = wsUrlToHttpUrl(options.hubServerUrl);
  const uploadUrl = buildDeviceSnapshotUrl(hubHttp, message.deviceId);

  await uploadSnapshot(uploadUrl, snapshot.bytes, {
    kind: snapshot.kind,
    mimeType: snapshot.mimeType,
    kindHeader: SNAPSHOT_KIND_HEADER,
    mimeHeader: SNAPSHOT_MIME_HEADER,
    databaseName: database.name,
    nameHeader: SNAPSHOT_NAME_HEADER,
  });
}
