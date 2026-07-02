import type { BottomPanelTab, WorkspacePreferences } from '../types/workspace';

const STORAGE_KEY = 'database-devtools-workspace-preferences';

const DEFAULT_PREFERENCES: WorkspacePreferences = {
  objectExplorerOpen: true,
  bottomPanelTab: 'results',
  editorSplitRatio: 0.42,
  navCollapsed: false,
};

function normalizeBottomPanelTab(value: unknown): BottomPanelTab {
  if (value === 'results' || value === 'data' || value === 'output' || value === 'history') {
    return value;
  }

  if (value === 'messages' || value === 'schema') {
    return value === 'schema' ? 'data' : 'output';
  }

  return 'results';
}

export function loadWorkspacePreferences(): WorkspacePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<WorkspacePreferences>;

    return {
      objectExplorerOpen:
        typeof parsed.objectExplorerOpen === 'boolean'
          ? parsed.objectExplorerOpen
          : DEFAULT_PREFERENCES.objectExplorerOpen,
      bottomPanelTab: normalizeBottomPanelTab(parsed.bottomPanelTab),
      editorSplitRatio:
        typeof parsed.editorSplitRatio === 'number'
          ? Math.min(0.75, Math.max(0.2, parsed.editorSplitRatio))
          : DEFAULT_PREFERENCES.editorSplitRatio,
      navCollapsed:
        typeof parsed.navCollapsed === 'boolean'
          ? parsed.navCollapsed
          : DEFAULT_PREFERENCES.navCollapsed,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveWorkspacePreferences(preferences: WorkspacePreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore storage errors.
  }
}
