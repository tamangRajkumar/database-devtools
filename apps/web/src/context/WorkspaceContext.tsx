import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const DEFAULT_SPLIT = 0.42;

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [objectExplorerOpen, setObjectExplorerOpen] = useState(true);
  const [bottomPanelTab, setBottomPanelTab] = useState<BottomPanelTab>('results');
  const [editorSplitRatio, setEditorSplitRatio] = useState(DEFAULT_SPLIT);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const toggleObjectExplorer = useCallback(() => {
    setObjectExplorerOpen((open) => !open);
  }, []);

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
    }),
    [
      objectExplorerOpen,
      toggleObjectExplorer,
      bottomPanelTab,
      editorSplitRatio,
      shortcutsOpen,
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
