import { useEditMode } from '../../context/EditModeContext';
import { useDevTools } from '../../context/DevToolsContext';

export function EditModeToggle() {
  const { hasDatabase, selectedDevice, connectionState } = useDevTools();
  const { editMode, setEditMode, transactionBusy } = useEditMode();

  const disabled =
    !hasDatabase || !selectedDevice || connectionState !== 'connected' || transactionBusy;

  return (
    <label className={`edit-mode-toggle ${editMode ? 'edit-mode-toggle--active' : ''}`}>
      <input
        type="checkbox"
        checked={editMode}
        disabled={disabled}
        onChange={(event) => setEditMode(event.target.checked)}
        aria-label="Enable edit mode"
      />
      <span className="edit-mode-toggle__label">Edit</span>
    </label>
  );
}
