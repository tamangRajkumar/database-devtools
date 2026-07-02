export type StoredSnapshot = {
  deviceId: string;
  bytes: Buffer;
  kind: string;
  mimeType: string;
  databaseName?: string;
  exportedAt: number;
};

export class SnapshotStore {
  private readonly snapshots = new Map<string, StoredSnapshot>();

  set(
    deviceId: string,
    bytes: Buffer,
    metadata: { kind: string; mimeType: string; databaseName?: string },
  ): StoredSnapshot {
    const stored: StoredSnapshot = {
      deviceId,
      bytes,
      kind: metadata.kind,
      mimeType: metadata.mimeType,
      databaseName: metadata.databaseName,
      exportedAt: Date.now(),
    };

    this.snapshots.set(deviceId, stored);
    return stored;
  }

  get(deviceId: string): StoredSnapshot | undefined {
    return this.snapshots.get(deviceId);
  }

  getBytes(deviceId: string): Buffer | undefined {
    return this.snapshots.get(deviceId)?.bytes;
  }
}
