import { useSqlWorkspace } from '../../context/SqlWorkspaceContext';

export function FavoritesList() {
  const { favorites, loadFavorite, deleteFavorite } = useSqlWorkspace();

  if (favorites.length === 0) {
    return <p className="sql-sidebar__empty">No saved favorites yet.</p>;
  }

  return (
    <ul className="sql-sidebar__list">
      {favorites.map((favorite) => (
        <li key={favorite.id} className="sql-sidebar__favorite">
          <button
            type="button"
            className="sql-sidebar__item"
            onClick={() => loadFavorite(favorite.id)}
          >
            <span className="sql-sidebar__item-title">{favorite.name}</span>
            <span className="sql-sidebar__item-meta mono">
              {favorite.sql.trim().split('\n')[0]?.slice(0, 40)}
            </span>
          </button>
          <button
            type="button"
            className="sql-sidebar__delete"
            aria-label={`Delete ${favorite.name}`}
            onClick={() => deleteFavorite(favorite.id)}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  );
}
