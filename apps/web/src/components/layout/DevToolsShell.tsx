import { useState } from 'react';
import { GlobalConfirmDialog } from '../edit/ConfirmDialog';
import { TransactionBar } from '../edit/TransactionBar';
import { ToastViewport } from '../ToastViewport';
import { StatusBar } from '../workspace/StatusBar';
import { MainContent } from './MainContent';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NavItem } from '../../types/navigation';

export function DevToolsShell() {
  const [activeNav, setActiveNav] = useState<NavItem>(NavItem.WORKSPACE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);

  return (
    <div className="devtools-shell">
      <TopBar onMenuToggle={() => setSidebarOpen((open) => !open)} />
      <TransactionBar />
      <GlobalConfirmDialog />
      <ToastViewport />
      <div className={`devtools-body ${navCollapsed ? 'devtools-body--nav-collapsed' : ''}`}>
        <Sidebar
          activeNav={activeNav}
          collapsed={navCollapsed}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavChange={setActiveNav}
          onToggleCollapse={() => setNavCollapsed((collapsed) => !collapsed)}
        />
        <MainContent activeNav={activeNav} />
      </div>
      <StatusBar />
    </div>
  );
}
