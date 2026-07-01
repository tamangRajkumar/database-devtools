import { NavItem } from '../../types/navigation';
import { ExplorerPanel } from '../../panels/ExplorerPanel';
import { OverviewPanel } from '../../panels/OverviewPanel';
import { QueryPanel } from '../../panels/QueryPanel';

type MainContentProps = {
  activeNav: NavItem;
};

export function MainContent({ activeNav }: MainContentProps) {
  return (
    <main className="main-content">
      {activeNav === NavItem.OVERVIEW && <OverviewPanel />}
      {activeNav === NavItem.EXPLORER && <ExplorerPanel />}
      {activeNav === NavItem.QUERY && <QueryPanel />}
    </main>
  );
}
