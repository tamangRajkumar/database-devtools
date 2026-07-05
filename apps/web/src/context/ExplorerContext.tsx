import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ColumnInfo, TablePageResult } from 'database-devtools';
import { filterTables, sortTables } from 'database-devtools/inspector-sqlite';
import { resolveExplorerTableSelection } from '../lib/resolveExplorerTableSelection';
import { useDevTools } from './DevToolsContext';

export type ExplorerView = 'data' | 'schema';

type ExplorerContextValue = {
  selectedTable: string | null;
  setSelectedTable: (table: string | null) => void;
  clearTableSelection: () => void;
  view: ExplorerView;
  setView: (view: ExplorerView) => void;
  tableSearch: string;
  setTableSearch: (value: string) => void;
  tableSort: 'name' | 'rows';
  setTableSort: (value: 'name' | 'rows') => void;
  tableSortDir: 'asc' | 'desc';
  toggleTableSortDir: () => void;
  filteredTables: ReturnType<typeof filterTables>;
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  rowSearch: string;
  setRowSearch: (value: string) => void;
  sortColumn: string | null;
  sortDir: 'asc' | 'desc';
  toggleSort: (column: string) => void;
  tablePage: TablePageResult | null;
  tableColumns: ColumnInfo[];
  totalPages: number;
  dataVersion: number;
  bumpDataVersion: () => void;
};

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export function ExplorerProvider({ children }: { children: ReactNode }) {
  const { hasDatabase, tables, schema, fetchTablePage, databaseSessionId } = useDevTools();

  const [selectedTable, setSelectedTableState] = useState<string | null>(null);
  const [view, setView] = useState<ExplorerView>('data');
  const [tableSearch, setTableSearch] = useState('');
  const [tableSort, setTableSort] = useState<'name' | 'rows'>('name');
  const [tableSortDir, setTableSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE_OPTIONS[1]);
  const [rowSearch, setRowSearch] = useState('');
  const [debouncedRowSearch, setDebouncedRowSearch] = useState('');
  const [sort, setSort] = useState<{ column: string | null; dir: 'asc' | 'desc' }>({
    column: null,
    dir: 'asc',
  });
  const [dataVersion, setDataVersion] = useState(0);

  const userClearedSelectionRef = useRef(false);
  const previousDeviceIdRef = useRef<string | null>(databaseSessionId);

  const bumpDataVersion = useCallback(() => {
    setDataVersion((version) => version + 1);
  }, []);

  const setSelectedTable = useCallback((table: string | null) => {
    if (table !== null) {
      userClearedSelectionRef.current = false;
    }

    setSelectedTableState(table);
  }, []);

  const clearTableSelection = useCallback(() => {
    userClearedSelectionRef.current = true;
    setSelectedTableState(null);
  }, []);

  const filteredTables = useMemo(
    () => sortTables(filterTables(tables, tableSearch), tableSort, tableSortDir),
    [tables, tableSearch, tableSort, tableSortDir],
  );

  const tableColumns = useMemo(() => {
    if (!selectedTable) {
      return [];
    }

    return schema.find((table) => table.name === selectedTable)?.columns ?? [];
  }, [schema, selectedTable]);

  useEffect(() => {
    if (databaseSessionId === previousDeviceIdRef.current) {
      return;
    }

    previousDeviceIdRef.current = databaseSessionId;
    userClearedSelectionRef.current = false;
    setSelectedTableState(null);
  }, [databaseSessionId]);

  useEffect(() => {
    if (!hasDatabase) {
      userClearedSelectionRef.current = false;
      setSelectedTableState(null);
      return;
    }

    if (tables.length === 0) {
      setSelectedTableState(null);
      return;
    }

    const tableNames = tables.map((table) => table.name);

    setSelectedTableState((current) =>
      resolveExplorerTableSelection(current, tableNames, userClearedSelectionRef.current),
    );
  }, [hasDatabase, tables]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedRowSearch(rowSearch);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [rowSearch]);

  useEffect(() => {
    setPage(1);
    setRowSearch('');
    setDebouncedRowSearch('');
    setSort({ column: null, dir: 'asc' });
  }, [selectedTable]);

  useEffect(() => {
    setPage(1);
  }, [debouncedRowSearch, sort.column, sort.dir, pageSize]);

  const tablePage = useMemo(() => {
    if (!hasDatabase || !selectedTable) {
      return null;
    }

    try {
      return fetchTablePage({
        table: selectedTable,
        page,
        pageSize,
        sortColumn: sort.column,
        sortDir: sort.dir,
        search: debouncedRowSearch,
      });
    } catch {
      return null;
    }
  }, [
    hasDatabase,
    selectedTable,
    page,
    pageSize,
    sort.column,
    sort.dir,
    debouncedRowSearch,
    fetchTablePage,
    dataVersion,
  ]);

  const totalPages = tablePage ? Math.max(1, Math.ceil(tablePage.totalCount / tablePage.pageSize)) : 1;

  const toggleTableSortDir = useCallback(() => {
    setTableSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
  }, []);

  const toggleSort = useCallback((column: string) => {
    setSort((current) => {
      if (current.column !== column) {
        return { column, dir: 'asc' };
      }

      if (current.dir === 'asc') {
        return { column, dir: 'desc' };
      }

      return { column: null, dir: 'asc' };
    });
  }, []);

  const value = useMemo(
    () => ({
      selectedTable,
      setSelectedTable,
      clearTableSelection,
      view,
      setView,
      tableSearch,
      setTableSearch,
      tableSort,
      setTableSort,
      tableSortDir,
      toggleTableSortDir,
      filteredTables,
      page,
      pageSize,
      setPage,
      setPageSize,
      rowSearch,
      setRowSearch,
      sortColumn: sort.column,
      sortDir: sort.dir,
      toggleSort,
      tablePage,
      tableColumns,
      totalPages,
      dataVersion,
      bumpDataVersion,
    }),
    [
      selectedTable,
      setSelectedTable,
      clearTableSelection,
      view,
      tableSearch,
      tableSort,
      tableSortDir,
      toggleTableSortDir,
      filteredTables,
      page,
      pageSize,
      rowSearch,
      sort.column,
      sort.dir,
      toggleSort,
      tablePage,
      tableColumns,
      totalPages,
      dataVersion,
      bumpDataVersion,
    ],
  );

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
}

export function useExplorer(): ExplorerContextValue {
  const context = useContext(ExplorerContext);

  if (!context) {
    throw new Error('useExplorer must be used within ExplorerProvider');
  }

  return context;
}

export { PAGE_SIZE_OPTIONS };
