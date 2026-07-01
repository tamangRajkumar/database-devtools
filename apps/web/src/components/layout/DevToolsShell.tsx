import { useState } from 'react';
import { GlobalConfirmDialog } from '../edit/ConfirmDialog';
import { TransactionBar } from '../edit/TransactionBar';
import { MainContent } from './MainContent';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { NavItem } from '../../types/navigation';

export function DevToolsShell() {
  const [activeNav, setActiveNav] = useState<NavItem>(NavItem.OVERVIEW);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="devtools-shell">
      <TopBar onMenuToggle={() => setSidebarOpen((open) => !open)} />
      <TransactionBar />
      <GlobalConfirmDialog />
      <div className="devtools-body">
        <Sidebar
          activeNav={activeNav}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavChange={setActiveNav}
        />
        <MainContent activeNav={activeNav} />
      </div>
    </div>
  );
}
