import { useWorkspace } from '../../context/WorkspaceContext';

const SHORTCUTS = [
  { keys: 'Ctrl+Enter', description: 'Run query (or selection)' },
  { keys: 'Ctrl+Shift+F', description: 'Format SQL' },
  { keys: '?', description: 'Show keyboard shortcuts' },
];

export function ShortcutsDialog() {
  const { shortcutsOpen, setShortcutsOpen } = useWorkspace();

  if (!shortcutsOpen) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="shortcuts-dialog__backdrop"
        aria-label="Close shortcuts"
        onClick={() => setShortcutsOpen(false)}
      />
      <div className="shortcuts-dialog" role="dialog" aria-labelledby="shortcuts-title">
        <h2 id="shortcuts-title" className="shortcuts-dialog__title">
          Keyboard shortcuts
        </h2>
        <ul className="shortcuts-dialog__list">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.keys} className="shortcuts-dialog__row">
              <kbd className="shortcuts-dialog__keys">{shortcut.keys}</kbd>
              <span>{shortcut.description}</span>
            </li>
          ))}
        </ul>
        <div className="shortcuts-dialog__actions">
          <button type="button" className="sql-toolbar__secondary" onClick={() => setShortcutsOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
