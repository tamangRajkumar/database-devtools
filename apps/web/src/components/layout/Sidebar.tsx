import { NAV_ITEMS, type NavItem } from '../../types/navigation';

type SidebarProps = {
  activeNav: NavItem;
  onNavChange: (nav: NavItem) => void;
  isOpen: boolean;
  onClose: () => void;
};

export function Sidebar({ activeNav, onNavChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <nav className="sidebar__nav" aria-label="DevTools sections">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar__item ${activeNav === item.id ? 'sidebar__item--active' : ''}`}
              aria-current={activeNav === item.id ? 'page' : undefined}
              onClick={() => {
                onNavChange(item.id);
                onClose();
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
