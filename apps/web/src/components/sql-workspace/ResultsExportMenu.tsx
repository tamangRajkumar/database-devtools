import { useEffect, useId, useRef, useState } from 'react';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';
import { ChevronIcon } from '../icons/NavIcons';

type ExportFormat = 'copy' | 'csv' | 'json' | 'excel';

type ResultsExportMenuProps = {
  disabled?: boolean;
};

const MENU_ITEMS: Array<{ format: ExportFormat; label: string }> = [
  { format: 'copy', label: 'Copy' },
  { format: 'csv', label: 'CSV' },
  { format: 'json', label: 'JSON' },
  { format: 'excel', label: 'Excel' },
];

export function ResultsExportMenu({ disabled = false }: ResultsExportMenuProps) {
  const { copyResults, exportCsv, exportJson, exportExcel } = useSqlWorkspace();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  const runExport = (format: ExportFormat) => {
    switch (format) {
      case 'copy':
        void copyResults();
        break;
      case 'csv':
        exportCsv();
        break;
      case 'json':
        exportJson();
        break;
      case 'excel':
        exportExcel();
        break;
    }

    setOpen(false);
  };

  return (
    <div className="results-export" ref={rootRef}>
      <button
        type="button"
        className="sql-toolbar__secondary results-export__trigger"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        Export
        <ChevronIcon expanded={open} size={12} />
      </button>

      {open && (
        <menu id={menuId} className="results-export__menu" role="menu" aria-label="Export results">
          {MENU_ITEMS.map((item) => (
            <li key={item.format} role="none">
              <button type="button" role="menuitem" onClick={() => runExport(item.format)}>
                {item.label}
              </button>
            </li>
          ))}
        </menu>
      )}
    </div>
  );
}
