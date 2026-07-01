import { useEffect, useMemo, useState } from 'react';
import type { ColumnInfo } from 'database-devtools';
import { useEditMode } from '../../context/EditModeContext';
import { useExplorer } from '../../context/ExplorerContext';
import {
  buildPrimaryKey,
  formatCellForInput,
  getPrimaryKeyColumns,
  parseCellInput,
} from '../../lib/rowKeys';

export function RowDetailDrawer() {
  const { selectedTable, selectedRow, setSelectedRow, tableColumns, bumpDataVersion } = useExplorer();
  const { editMode, transactionOpen, executeWrite, requestConfirm } = useEditMode();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const primaryKeyColumns = useMemo(() => getPrimaryKeyColumns(tableColumns), [tableColumns]);
  const canEdit = editMode && transactionOpen;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedRow(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedRow]);

  useEffect(() => {
    if (!selectedRow) {
      setDraft({});
      return;
    }

    const nextDraft: Record<string, string> = {};

    for (const [column, value] of Object.entries(selectedRow.values)) {
      nextDraft[column] = formatCellForInput(value);
    }

    setDraft(nextDraft);
  }, [selectedRow]);

  if (!selectedRow || !selectedTable) {
    return null;
  }

  const handleSave = () => {
    const originalValues = selectedRow.values;
    const nextValues = Object.fromEntries(
      tableColumns.map((column) => [
        column.name,
        parseCellInput(draft[column.name] ?? '', column.type),
      ]),
    );

    const changedEntries = tableColumns.filter((column) => {
      if (primaryKeyColumns.includes(column.name)) {
        return false;
      }

      return nextValues[column.name] !== originalValues[column.name];
    });

    if (changedEntries.length === 0) {
      return;
    }

    const values = Object.fromEntries(
      changedEntries.map((column) => [column.name, nextValues[column.name] ?? null]),
    );

    requestConfirm({
      title: 'Save row changes',
      message: `Update ${changedEntries.length} column${changedEntries.length === 1 ? '' : 's'} in ${selectedTable}?`,
      confirmLabel: 'Save',
      onConfirm: async () => {
        setSaving(true);

        try {
          await executeWrite({
            kind: 'update',
            table: selectedTable,
            primaryKey: buildPrimaryKey(originalValues, tableColumns),
            values,
          });
          bumpDataVersion();
          setSelectedRow({
            ...selectedRow,
            values: nextValues,
          });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleDelete = () => {
    requestConfirm({
      title: 'Delete row',
      message: `Permanently delete this row from ${selectedTable}?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        setSaving(true);

        try {
          await executeWrite({
            kind: 'delete',
            table: selectedTable,
            primaryKey: buildPrimaryKey(selectedRow.values, tableColumns),
          });
          bumpDataVersion();
          setSelectedRow(null);
        } finally {
          setSaving(false);
        }
      },
    });
  };

  return (
    <>
      <button
        type="button"
        className="row-drawer__backdrop"
        aria-label="Close row details"
        onClick={() => setSelectedRow(null)}
      />
      <aside className="row-drawer" role="dialog" aria-label="Row details">
        <header className="row-drawer__header">
          <div>
            <p className="row-drawer__label">{canEdit ? 'Edit row' : 'Row details'}</p>
            <h3 className="row-drawer__title mono">{selectedTable}</h3>
          </div>
          <button
            type="button"
            className="explorer-icon-button"
            onClick={() => setSelectedRow(null)}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <dl className="row-drawer__fields">
          {tableColumns.map((column) => (
            <RowField
              key={column.name}
              column={column}
              value={draft[column.name] ?? ''}
              readOnly={!canEdit || primaryKeyColumns.includes(column.name)}
              onChange={(next) => setDraft((current) => ({ ...current, [column.name]: next }))}
            />
          ))}
        </dl>

        {canEdit && (
          <footer className="row-drawer__footer">
            <button
              type="button"
              className="button button--danger"
              disabled={saving}
              onClick={handleDelete}
            >
              Delete
            </button>
            <button
              type="button"
              className="button button--primary"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}

function RowField({
  column,
  value,
  readOnly,
  onChange,
}: {
  column: ColumnInfo;
  value: string;
  readOnly: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="row-drawer__field">
      <dt className="mono">
        {column.name}
        {column.pk && <span className="row-drawer__pk">PK</span>}
      </dt>
      <dd>
        {readOnly ? (
          value === '' ? (
            <span className="data-grid__null">NULL</span>
          ) : (
            <span className="mono">{value}</span>
          )
        ) : (
          <input
            type="text"
            className="row-drawer__input mono"
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </dd>
    </div>
  );
}
