import type { ConfirmAction } from '../../context/EditModeContext';
import { useEditMode } from '../../context/EditModeContext';

type ConfirmDialogProps = {
  action: ConfirmAction;
  onClose: () => void;
};

export function ConfirmDialog({ action, onClose }: ConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await action.onConfirm();
      onClose();
    } catch {
      // Error surfaced via EditModeContext.writeError
    }
  };

  return (
    <>
      <button type="button" className="confirm-dialog__backdrop" aria-label="Close dialog" onClick={onClose} />
      <div className="confirm-dialog" role="alertdialog" aria-labelledby="confirm-dialog-title">
        <h3 id="confirm-dialog-title" className="confirm-dialog__title">
          {action.title}
        </h3>
        <p className="confirm-dialog__message">{action.message}</p>
        <div className="confirm-dialog__actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={`button ${action.destructive ? 'button--danger' : 'button--primary'}`}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {action.confirmLabel ?? 'Confirm'}
          </button>
        </div>
      </div>
    </>
  );
}

export function GlobalConfirmDialog() {
  const { confirmAction, closeConfirm } = useEditMode();

  if (!confirmAction) {
    return null;
  }

  return <ConfirmDialog action={confirmAction} onClose={closeConfirm} />;
}
