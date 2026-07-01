/** Database adapter interface for export and future query operations. */
export interface DatabaseAdapter {
  readonly id: string;
  readonly name: string;
  exportSnapshot(): Promise<Uint8Array>;
}
