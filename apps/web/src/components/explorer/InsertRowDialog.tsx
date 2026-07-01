import { useState } from 'react';
import type { ColumnInfo } from 'database-devtools';
import { useEditMode } from '../../context/EditModeContext';
import { useExplorer } from '../../context/ExplorerContext';
import { parseCellInput } from '../../lib/rowKeys';

type InsertRowDialogProps = {
  onClose: () => void;
};

export function InsertRowDialog({ onClose }: InsertRowDialogProps) {
  const { selectedTable, tableColumns, bumpDataVersion } = useExplorer();
  const { executeWrite, requestConfirm, transactionOpen } = useEditMode();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};

    for (const column of tableColumns) {
      initial[column.name] = column.defaultValue ?? '';
    }

    return initial;
  });
  const [saving, setSaving] = useState(false);

  if (!selectedTable || !transactionOpen) {
    return null;
  }

  const handleSubmit = () => {
    requestConfirm({
      title: 'Insert row',
      message: `Insert a new row into ${selectedTable}?`,
      confirmLabel: 'Insert',
      onConfirm: async () => {
        setSaving(true);

        try {
          const parsedValues = Object.fromEntries(
            tableColumns
              .filter((column) => (values[column.name] ?? '').trim() !== '' || column.notNull)
              .map((column) => [
                column.name,
                parseCellInput(values[column.name] ?? '', column.type),
              ]),
          );

          await executeWrite({
            kind: 'insert',
            table: selectedTable,
            values: parsedValues,
          });
          bumpDataVersion();
          onClose();
        } finally {
          setSaving(false);
        }
      },
    });
  };

  return (
    <>
      <button type="button" className="confirm-dialog__backdrop" aria-label="Close dialog" onClick={onClose} />
      <div className="confirm-dialog insert-row-dialog" role="dialog" aria-labelledby="insert-row-title">
        <h3 id="insert-row-title" className="confirm-dialog__title">
          Insert row into <span className="mono">{selectedTable}</span>
        </h3>

        <div className="insert-row-dialog__fields">
          {tableColumns.map((column) => (
            <FieldInput
              key={column.name}
              column={column}
              value={values[column.name] ?? ''}
              onChange={(next) => setValues((current) => ({ ...current, [column.name]: next }))}
            />
          ))}
        </div>

        <div className="confirm-dialog__actions">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="button button--primary"
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? 'Inserting…' : 'Insert'}
          </button>
        </div>
      </div>
    </>
  );
}

function FieldInput({
  column,
  value,
  onChange,
}: {
  column: ColumnInfo;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="insert-row-dialog__field">
      <span className="insert-row-dialog__label mono">
        {column.name}
        {column.notNull && <span className="insert-row-dialog__required">*</span>}
      </span>
      <input
        type="text"
        className="insert-row-dialog__input mono"
        value={value}
        placeholder={column.pk ? 'auto' : column.type}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
