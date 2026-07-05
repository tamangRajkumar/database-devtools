import { useState, type FormEvent } from 'react';
import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';

export function SaveFavoriteDialog() {
  const { saveDialogOpen, closeSaveDialog, saveFavorite } = useSqlWorkspace();
  const [name, setName] = useState('');

  if (!saveDialogOpen) {
    return null;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    saveFavorite(name);
    setName('');
  };

  return (
    <>
      <button
        type="button"
        className="row-drawer__backdrop"
        aria-label="Close save dialog"
        onClick={closeSaveDialog}
      />
      <div className="sql-dialog" role="dialog" aria-labelledby="save-favorite-title">
        <h3 id="save-favorite-title" className="sql-dialog__title">
          Save favorite query
        </h3>
        <form onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="favorite-name">
            Name
          </label>
          <input
            id="favorite-name"
            className="explorer-search"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="My query"
            autoFocus
          />
          <div className="sql-dialog__actions">
            <button type="button" className="sql-toolbar__secondary" onClick={closeSaveDialog}>
              Cancel
            </button>
            <button type="submit" className="query-run-button" disabled={!name.trim()}>
              Save
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
