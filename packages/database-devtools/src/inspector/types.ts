import type { InspectorCapabilities } from '../types/capabilities';
import type { DatabaseKind } from '../types/kind';
import type {
  QueryResult,
  SchemaTable,
  TableInfo,
  TablePageRequest,
  TablePageResult,
} from '../types/inspection';
import type { SnapshotExport } from '../types/snapshot';

export interface DatabaseInspector {
  readonly kind: DatabaseKind;
  readonly capabilities: InspectorCapabilities;
  open(snapshot: SnapshotExport | ArrayBuffer): Promise<void>;
  close(): void;
  listTables(): TableInfo[];
  getSchema(): SchemaTable[];
  fetchTablePage(request: TablePageRequest): TablePageResult;
  executeQuery(sql: string): QueryResult;
}

export type InspectorDefinition = {
  kind: DatabaseKind;
  displayName: string;
  mimeTypes: string[];
  canOpenBytes?: (bytes: ArrayBuffer) => boolean;
  createInspector: () => DatabaseInspector | Promise<DatabaseInspector>;
};
