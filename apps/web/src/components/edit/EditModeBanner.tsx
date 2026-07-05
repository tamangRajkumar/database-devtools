import { useEditMode } from '../../context/EditModeContext';

export function EditModeBanner() {
  const { editMode, transactionOpen } = useEditMode();

  if (!editMode) {
    return null;
  }

  return (
    <div className="edit-mode-banner" role="status">
      <strong>Edit mode is on.</strong> Changes are written to the live device database
      {transactionOpen ? ' inside an open transaction.' : ' — starting transaction…'}
    </div>
  );
}
