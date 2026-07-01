import { useEffect } from 'react';
import { useExplorer } from '../../context/ExplorerContext';

export function RowDetailDrawer() {
  const { selectedTable, selectedRow, setSelectedRow } = useExplorer();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedRow(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedRow]);

  if (!selectedRow || !selectedTable) {
    return null;
  }

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
            <p className="row-drawer__label">Row details</p>
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
          {Object.entries(selectedRow.values).map(([column, value]) => (
            <div key={column} className="row-drawer__field">
              <dt className="mono">{column}</dt>
              <dd>
                {value === null ? (
                  <span className="data-grid__null">NULL</span>
                ) : (
                  <span className="mono">{String(value)}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </aside>
    </>
  );
}
