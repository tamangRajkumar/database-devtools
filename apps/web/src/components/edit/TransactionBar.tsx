import { useEditMode } from '../../context/EditModeContext';

export function TransactionBar() {
  const {
    editMode,
    transactionOpen,
    transactionBusy,
    pendingWrites,
    writeError,
    clearWriteError,
    requestConfirm,
    commitTransaction,
    rollbackTransaction,
  } = useEditMode();

  if (!editMode) {
    return null;
  }

  const handleCommit = () => {
    requestConfirm({
      title: 'Commit changes',
      message: 'Apply all pending edits to the live database on the device?',
      confirmLabel: 'Commit',
      onConfirm: commitTransaction,
    });
  };

  const handleRollback = () => {
    requestConfirm({
      title: 'Discard changes',
      message: 'Roll back all edits in this transaction?',
      confirmLabel: 'Discard',
      destructive: true,
      onConfirm: rollbackTransaction,
    });
  };

  return (
    <div className="transaction-bar" role="status">
      <div className="transaction-bar__left">
        <span className={`transaction-bar__status ${transactionOpen ? 'transaction-bar__status--open' : ''}`}>
          {transactionBusy
            ? 'Transaction in progress…'
            : transactionOpen
              ? 'Transaction open'
              : 'Starting transaction…'}
        </span>
        {pendingWrites > 0 && (
          <span className="transaction-bar__meta">
            {pendingWrites} pending write{pendingWrites === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="transaction-bar__actions">
        {writeError && (
          <button type="button" className="transaction-bar__error" onClick={clearWriteError}>
            {writeError}
          </button>
        )}
        <button
          type="button"
          className="button button--ghost"
          disabled={!transactionOpen || transactionBusy || pendingWrites > 0}
          onClick={handleRollback}
        >
          Discard
        </button>
        <button
          type="button"
          className="button button--primary"
          disabled={!transactionOpen || transactionBusy || pendingWrites > 0}
          onClick={handleCommit}
        >
          Commit
        </button>
      </div>
    </div>
  );
}
