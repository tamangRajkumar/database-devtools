import { useEffect, useRef, useState } from 'react';
import { GlobalConfirmDialog } from '../edit/ConfirmDialog';
import { EditModeBanner } from '../edit/EditModeBanner';
import { TransactionBar } from '../edit/TransactionBar';
import { ToastViewport } from '../ToastViewport';
import { SHOW_EDIT_MODE } from '../../lib/featureFlags';
import { useMobileLayout } from '../../hooks/useMobileLayout';
import { MainContent } from './MainContent';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { ConnectionHelpBanner } from './ConnectionHelpBanner';
import { NavItem } from '../../types/navigation';
import { useDevTools } from '../../context/DevToolsContext';
import { useWorkspace } from '../../context/WorkspaceContext';

function FirstDatabaseWorkspaceRedirect({ onOpenWorkspace }: { onOpenWorkspace: () => void }) {
  const { hasDatabase } = useDevTools();
  const openedRef = useRef(false);

  useEffect(() => {
    if (hasDatabase && !openedRef.current) {
      openedRef.current = true;
      onOpenWorkspace();
    }
  }, [hasDatabase, onOpenWorkspace]);

  return null;
}

export function DevToolsShell() {
  const [activeNav, setActiveNav] = useState<NavItem>(NavItem.WORKSPACE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const { navCollapsed, setNavCollapsed } = useWorkspace();
  const isMobile = useMobileLayout();

  const openWorkspace = () => setActiveNav(NavItem.WORKSPACE);

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  const handleMenuToggle = () => {
    if (isMobile) {
      setSidebarOpen((open) => !open);
      return;
    }

    setNavHidden((hidden) => !hidden);
  };

  const menuExpanded = isMobile ? sidebarOpen : !navHidden;

  return (
    <>
      <div className="devtools-shell">
        <header className="devtools-shell__header">
          <TopBar menuExpanded={menuExpanded} onMenuToggle={handleMenuToggle} />
          <div className="devtools-chrome">
            <ConnectionHelpBanner />
            {SHOW_EDIT_MODE && <EditModeBanner />}
            {SHOW_EDIT_MODE && <TransactionBar />}
          </div>
        </header>

        <div
          className={`devtools-body ${navCollapsed ? 'devtools-body--nav-collapsed' : ''} ${!isMobile && navHidden ? 'devtools-body--nav-hidden' : ''}`}
        >
          <Sidebar
            activeNav={activeNav}
            collapsed={navCollapsed}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onNavChange={setActiveNav}
            onToggleCollapse={() => setNavCollapsed(!navCollapsed)}
          />
          <MainContent activeNav={activeNav} onNavigate={setActiveNav} />
        </div>
      </div>

      <GlobalConfirmDialog />
      <ToastViewport />
      <FirstDatabaseWorkspaceRedirect onOpenWorkspace={openWorkspace} />
    </>
  );
}
