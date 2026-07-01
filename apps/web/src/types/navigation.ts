export const NavItem = {
  OVERVIEW: 'overview',
  EXPLORER: 'explorer',
  SQL: 'sql',
} as const;

export type NavItem = (typeof NavItem)[keyof typeof NavItem];

export type NavEntry = {
  id: NavItem;
  label: string;
};

export const NAV_ITEMS: NavEntry[] = [
  { id: NavItem.OVERVIEW, label: 'Overview' },
  { id: NavItem.EXPLORER, label: 'Explorer' },
  { id: NavItem.SQL, label: 'SQL' },
];
