export const NavItem = {
  OVERVIEW: 'overview',
  WORKSPACE: 'workspace',
} as const;

export type NavItem = (typeof NavItem)[keyof typeof NavItem];

export type NavEntry = {
  id: NavItem;
  label: string;
  icon: 'overview' | 'workspace';
};

export const NAV_ITEMS: NavEntry[] = [
  { id: NavItem.OVERVIEW, label: 'Overview', icon: 'overview' },
  { id: NavItem.WORKSPACE, label: 'Workspace', icon: 'workspace' },
];
