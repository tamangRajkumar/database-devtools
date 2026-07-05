import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { WriteOperation } from 'database-devtools';
import { SHOW_EDIT_MODE } from '../lib/featureFlags';
import { useDevTools } from './DevToolsContext';

const EDIT_MODE_STORAGE_KEY = 'database-devtools-edit-mode';

export type ConfirmAction = {
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
};

type EditModeContextValue = {
  editMode: boolean;
  setEditMode: (enabled: boolean) => void;
  transactionOpen: boolean;
  transactionBusy: boolean;
  pendingWrites: number;
  writeError: string | null;
  clearWriteError: () => void;
  confirmAction: ConfirmAction | null;
  closeConfirm: () => void;
  requestConfirm: (action: ConfirmAction) => void;
  startTransaction: () => Promise<void>;
  commitTransaction: () => Promise<void>;
  rollbackTransaction: () => Promise<void>;
  executeWrite: (operation: WriteOperation) => Promise<{ rowsAffected: number }>;
};

const EditModeContext = createContext<EditModeContextValue | null>(null);

export function EditModeProvider({ children }: { children: ReactNode }) {
  const {
    connectionState,
    selectedDeviceId,
    hasDatabase,
    refresh,
    beginWriteTransaction,
    commitWriteTransaction,
    rollbackWriteTransaction,
    executeWriteOperation,
    transactionState,
  } = useDevTools();

  const [editMode, setEditModeState] = useState(false);
  const [pendingWrites, setPendingWrites] = useState(0);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const setEditMode = useCallback((enabled: boolean) => {
    if (!SHOW_EDIT_MODE) {
      setEditModeState(false);
      return;
    }

    setEditModeState(enabled);
    window.localStorage.setItem(EDIT_MODE_STORAGE_KEY, String(enabled));
  }, []);

  const transactionOpen = transactionState === 'open';
  const transactionBusy =
    transactionState === 'opening' ||
    transactionState === 'committing' ||
    transactionState === 'rolling_back';

  useEffect(() => {
    if (!SHOW_EDIT_MODE || !editMode || transactionOpen || transactionBusy) {
      return;
    }

    if (!selectedDeviceId || !hasDatabase || connectionState !== 'connected') {
      return;
    }

    void beginWriteTransaction().catch((error) => {
      setWriteError(error instanceof Error ? error.message : 'Failed to start transaction');
      setEditMode(false);
    });
  }, [
    editMode,
    transactionOpen,
    transactionBusy,
    selectedDeviceId,
    hasDatabase,
    connectionState,
    beginWriteTransaction,
    setEditMode,
  ]);

  useEffect(() => {
    if (!editMode) {
      if (transactionOpen) {
        void rollbackWriteTransaction().catch(() => undefined);
      }
    }
  }, [editMode, transactionOpen, rollbackWriteTransaction]);

  const startTransaction = useCallback(async () => {
    setWriteError(null);
    await beginWriteTransaction();
  }, [beginWriteTransaction]);

  const commitTransaction = useCallback(async () => {
    setWriteError(null);
    await commitWriteTransaction();
    refresh();
  }, [commitWriteTransaction, refresh]);

  const rollbackTransaction = useCallback(async () => {
    setWriteError(null);
    await rollbackWriteTransaction();
  }, [rollbackWriteTransaction]);

  const executeWrite = useCallback(
    async (operation: WriteOperation) => {
      setWriteError(null);
      setPendingWrites((count) => count + 1);

      try {
        return await executeWriteOperation(operation);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Write failed';
        setWriteError(message);
        throw error;
      } finally {
        setPendingWrites((count) => Math.max(0, count - 1));
      }
    },
    [executeWriteOperation],
  );

  const closeConfirm = useCallback(() => {
    setConfirmAction(null);
  }, []);

  const requestConfirm = useCallback((action: ConfirmAction) => {
    setConfirmAction(action);
  }, []);

  const clearWriteError = useCallback(() => {
    setWriteError(null);
  }, []);

  const value = useMemo(
    () => ({
      editMode,
      setEditMode,
      transactionOpen,
      transactionBusy,
      pendingWrites,
      writeError,
      clearWriteError,
      confirmAction,
      closeConfirm,
      requestConfirm,
      startTransaction,
      commitTransaction,
      rollbackTransaction,
      executeWrite,
    }),
    [
      editMode,
      setEditMode,
      transactionOpen,
      transactionBusy,
      pendingWrites,
      writeError,
      clearWriteError,
      confirmAction,
      closeConfirm,
      requestConfirm,
      startTransaction,
      commitTransaction,
      rollbackTransaction,
      executeWrite,
    ],
  );

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
}

export function useEditMode(): EditModeContextValue {
  const context = useContext(EditModeContext);

  if (!context) {
    throw new Error('useEditMode must be used within EditModeProvider');
  }

  return context;
}
