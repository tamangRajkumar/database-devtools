export type BottomPanelTab = 'results' | 'messages' | 'data' | 'schema' | 'history';

export type QueryTab = {
  id: string;
  title: string;
  sql: string;
  dirty: boolean;
};

export type ExecutionMeta = {
  durationMs: number;
  rowCount: number;
  ranAt: number;
};
