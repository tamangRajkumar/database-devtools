import { useEffect, useRef, useState } from 'react';
import { GlobalConfirmDialog } from '../edit/ConfirmDialog';
import { EditModeBanner } from '../edit/EditModeBanner';
import { TransactionBar } from '../edit/TransactionBar';
import { ToastViewport } from '../ToastViewport';
import { StatusBar } from '../workspace/StatusBar';
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
  const { navCollapsed, setNavCollapsed } = useWorkspace();

  const openWorkspace = () => setActiveNav(NavItem.WORKSPACE);

  return (
    <>
      <div className="devtools-shell">
        <header className="devtools-shell__header">
          <TopBar onMenuToggle={() => setSidebarOpen((open) => !open)} />
          <div className="devtools-chrome">
            <ConnectionHelpBanner />
            <EditModeBanner />
            <TransactionBar />
          </div>
        </header>

        <div className={`devtools-body ${navCollapsed ? 'devtools-body--nav-collapsed' : ''}`}>
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

        <StatusBar />
      </div>

      <GlobalConfirmDialog />
      <ToastViewport />
      <FirstDatabaseWorkspaceRedirect onOpenWorkspace={openWorkspace} />
    </>
  );
}
