import { NAV_ITEMS, type NavItem } from '../../types/navigation';
import { OverviewIcon, WorkspaceIcon, ChevronIcon } from '../icons/NavIcons';

type SidebarProps = {
  activeNav: NavItem;
  onNavChange: (nav: NavItem) => void;
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
};

function NavIcon({ icon }: { icon: 'overview' | 'workspace' }) {
  if (icon === 'overview') {
    return <OverviewIcon />;
  }

  return <WorkspaceIcon />;
}

export function Sidebar({
  activeNav,
  onNavChange,
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''} ${collapsed ? 'sidebar--collapsed' : ''}`}>
        <nav className="sidebar__nav" aria-label="DevTools sections">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar__item ${activeNav === item.id ? 'sidebar__item--active' : ''}`}
              aria-current={activeNav === item.id ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              onClick={() => {
                onNavChange(item.id);
                onClose();
              }}
            >
              <span className="sidebar__icon" aria-hidden>
                <NavIcon icon={item.icon} />
              </span>
              {!collapsed && <span className="sidebar__label">{item.label}</span>}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="sidebar__collapse"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          onClick={onToggleCollapse}
        >
          <ChevronIcon expanded={!collapsed} />
        </button>
      </aside>
    </>
  );
}
