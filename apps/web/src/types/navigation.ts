export const NavItem = {
  OVERVIEW: 'overview',
  TABLES: 'tables',
  QUERY: 'query',
  SCHEMA: 'schema',
} as const;

export type NavItem = (typeof NavItem)[keyof typeof NavItem];

export type NavEntry = {
  id: NavItem;
  label: string;
};

export const NAV_ITEMS: NavEntry[] = [
  { id: NavItem.OVERVIEW, label: 'Overview' },
  { id: NavItem.TABLES, label: 'Tables' },
  { id: NavItem.QUERY, label: 'Query' },
  { id: NavItem.SCHEMA, label: 'Schema' },
];
