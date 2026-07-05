import { useToast } from '../context/ToastContext';

export function ToastViewport() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div aria-label="Notifications" className="toast-viewport" role="region">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.variant ?? 'info'}`}
          role="status"
          aria-live="polite"
        >
          <div className="toast__content">
            <p className="toast__title">{toast.title}</p>
            <p className="toast__message">{toast.message}</p>
          </div>
          <button
            type="button"
            className="toast__dismiss"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
