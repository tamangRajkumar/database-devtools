import { DEFAULT_SQL } from '../types/sqlWorkspace';

export type StoredQueryTab = {
  id: string;
  title: string;
  sql: string;
};

const STORAGE_KEY = 'database-devtools-query-tabs';

function scopeKey(deviceId: string | null): string {
  return deviceId ?? '__global__';
}

type TabStore = Record<string, { tabs: StoredQueryTab[]; activeTabId: string }>;

function readStore(): TabStore {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as TabStore;
  } catch {
    return {};
  }
}

function writeStore(store: TabStore): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function createDefaultTab(): StoredQueryTab {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'Query 1',
    sql: DEFAULT_SQL,
  };
}

export function loadQueryTabs(deviceId: string | null): {
  tabs: StoredQueryTab[];
  activeTabId: string;
} {
  const store = readStore();
  const scoped = store[scopeKey(deviceId)];

  if (!scoped || scoped.tabs.length === 0) {
    const tab = createDefaultTab();
    return { tabs: [tab], activeTabId: tab.id };
  }

  const activeTabId = scoped.tabs.some((tab) => tab.id === scoped.activeTabId)
    ? scoped.activeTabId
    : scoped.tabs[0]!.id;

  return { tabs: scoped.tabs, activeTabId };
}

export function saveQueryTabs(
  deviceId: string | null,
  tabs: StoredQueryTab[],
  activeTabId: string,
): void {
  const store = readStore();
  store[scopeKey(deviceId)] = { tabs, activeTabId };
  writeStore(store);
}

export function createQueryTab(index: number): StoredQueryTab {
  return {
    id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `Query ${index}`,
    sql: '',
  };
}
