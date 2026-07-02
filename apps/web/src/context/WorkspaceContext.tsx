import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  loadWorkspacePreferences,
  saveWorkspacePreferences,
} from '../lib/workspacePreferences';
import type { BottomPanelTab } from '../types/workspace';

type WorkspaceContextValue = {
  objectExplorerOpen: boolean;
  toggleObjectExplorer: () => void;
  setObjectExplorerOpen: (open: boolean) => void;
  bottomPanelTab: BottomPanelTab;
  setBottomPanelTab: (tab: BottomPanelTab) => void;
  editorSplitRatio: number;
  setEditorSplitRatio: (ratio: number) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  outputUnread: boolean;
  clearOutputUnread: () => void;
  markOutputUnread: () => void;
  navCollapsed: boolean;
  setNavCollapsed: (collapsed: boolean) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(() => loadWorkspacePreferences(), []);
  const [objectExplorerOpen, setObjectExplorerOpenState] = useState(initial.objectExplorerOpen);
  const [bottomPanelTab, setBottomPanelTabState] = useState<BottomPanelTab>(initial.bottomPanelTab);
  const [editorSplitRatio, setEditorSplitRatioState] = useState(initial.editorSplitRatio);
  const [navCollapsed, setNavCollapsedState] = useState(initial.navCollapsed);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [outputUnread, setOutputUnread] = useState(false);

  const persist = useCallback(
    (next: {
      objectExplorerOpen: boolean;
      bottomPanelTab: BottomPanelTab;
      editorSplitRatio: number;
      navCollapsed: boolean;
    }) => {
      saveWorkspacePreferences(next);
    },
    [],
  );

  const setObjectExplorerOpen = useCallback(
    (open: boolean) => {
      setObjectExplorerOpenState(open);
      persist({
        objectExplorerOpen: open,
        bottomPanelTab,
        editorSplitRatio,
        navCollapsed,
      });
    },
    [bottomPanelTab, editorSplitRatio, navCollapsed, persist],
  );

  const toggleObjectExplorer = useCallback(() => {
    setObjectExplorerOpenState((current) => {
      const next = !current;
      persist({
        objectExplorerOpen: next,
        bottomPanelTab,
        editorSplitRatio,
        navCollapsed,
      });
      return next;
    });
  }, [bottomPanelTab, editorSplitRatio, navCollapsed, persist]);

  const setBottomPanelTab = useCallback(
    (tab: BottomPanelTab) => {
      setBottomPanelTabState(tab);
      persist({
        objectExplorerOpen,
        bottomPanelTab: tab,
        editorSplitRatio,
        navCollapsed,
      });

      if (tab === 'output') {
        setOutputUnread(false);
      }
    },
    [editorSplitRatio, navCollapsed, objectExplorerOpen, persist],
  );

  const setEditorSplitRatio = useCallback(
    (ratio: number) => {
      const clamped = Math.min(0.75, Math.max(0.2, ratio));
      setEditorSplitRatioState(clamped);
      persist({
        objectExplorerOpen,
        bottomPanelTab,
        editorSplitRatio: clamped,
        navCollapsed,
      });
    },
    [bottomPanelTab, navCollapsed, objectExplorerOpen, persist],
  );

  const setNavCollapsed = useCallback(
    (collapsed: boolean) => {
      setNavCollapsedState(collapsed);
      persist({
        objectExplorerOpen,
        bottomPanelTab,
        editorSplitRatio,
        navCollapsed: collapsed,
      });
    },
    [bottomPanelTab, editorSplitRatio, objectExplorerOpen, persist],
  );

  const clearOutputUnread = useCallback(() => {
    setOutputUnread(false);
  }, []);

  const markOutputUnread = useCallback(() => {
    setOutputUnread(true);
  }, []);

  useEffect(() => {
    persist({
      objectExplorerOpen,
      bottomPanelTab,
      editorSplitRatio,
      navCollapsed,
    });
  }, [bottomPanelTab, editorSplitRatio, navCollapsed, objectExplorerOpen, persist]);

  const value = useMemo(
    () => ({
      objectExplorerOpen,
      toggleObjectExplorer,
      setObjectExplorerOpen,
      bottomPanelTab,
      setBottomPanelTab,
      editorSplitRatio,
      setEditorSplitRatio,
      shortcutsOpen,
      setShortcutsOpen,
      outputUnread,
      clearOutputUnread,
      markOutputUnread,
      navCollapsed,
      setNavCollapsed,
    }),
    [
      objectExplorerOpen,
      toggleObjectExplorer,
      setObjectExplorerOpen,
      bottomPanelTab,
      setBottomPanelTab,
      editorSplitRatio,
      setEditorSplitRatio,
      shortcutsOpen,
      outputUnread,
      clearOutputUnread,
      markOutputUnread,
      navCollapsed,
      setNavCollapsed,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }

  return context;
}
