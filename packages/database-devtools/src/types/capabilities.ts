export type AdapterCapabilities = {
  exportSnapshot: boolean;
  executeQuery: boolean;
  listTables: boolean;
  getSchema: boolean;
  transactionalWrites: boolean;
  observeChanges: boolean;
  importSnapshot: boolean;
};

export type InspectorCapabilities = {
  explorer: boolean;
  schemaView: boolean;
  tableData: boolean;
  sqlWorkspace: boolean;
};

export const DEFAULT_ADAPTER_CAPABILITIES: AdapterCapabilities = {
  exportSnapshot: false,
  executeQuery: false,
  listTables: false,
  getSchema: false,
  transactionalWrites: false,
  observeChanges: false,
  importSnapshot: false,
};

export const DEFAULT_INSPECTOR_CAPABILITIES: InspectorCapabilities = {
  explorer: false,
  schemaView: false,
  tableData: false,
  sqlWorkspace: false,
};
