import { PAGE_SIZE_OPTIONS, useExplorer } from '../../context/ExplorerContext';

export function PaginationBar() {
  const { page, setPage, pageSize, setPageSize, totalPages, tablePage } = useExplorer();

  if (!tablePage) {
    return null;
  }

  return (
    <div className="pagination-bar">
      <div className="pagination-bar__left">
        <label className="pagination-bar__label">
          Rows per page
          <select
            className="explorer-select"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="pagination-bar__center">
        Page {page} of {totalPages}
        <span className="pagination-bar__count">
          ({tablePage.totalCount.toLocaleString()} total)
        </span>
      </div>

      <div className="pagination-bar__right">
        <button
          type="button"
          className="pagination-bar__button"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="pagination-bar__button"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
