export type BottomPanelTab = 'results' | 'data' | 'output' | 'history';

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

export type WorkspacePreferences = {
  objectExplorerOpen: boolean;
  bottomPanelTab: BottomPanelTab;
  editorSplitRatio: number;
  navCollapsed: boolean;
};
