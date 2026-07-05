import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastVariant = 'success' | 'info' | 'error';

export type ToastInput = {
  title: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
};

export type ToastItem = ToastInput & {
  id: string;
};

type ToastContextValue = {
  toasts: ToastItem[];
  showToast: (input: ToastInput) => void;
  dismissToast: (id: string) => void;
};

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_TOAST_DURATION_MS = 5000;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const toast: ToastItem = {
        id,
        title: input.title,
        message: input.message,
        variant: input.variant ?? 'info',
        durationMs: input.durationMs ?? DEFAULT_TOAST_DURATION_MS,
      };

      setToasts((current) => [...current.slice(-(MAX_VISIBLE_TOASTS - 1)), toast]);

      const timer = setTimeout(() => {
        dismissToast(id);
      }, toast.durationMs);

      timersRef.current.set(id, timer);
    },
    [dismissToast],
  );

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
    }),
    [toasts, showToast, dismissToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
