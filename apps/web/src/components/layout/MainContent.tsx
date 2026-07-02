import { NavItem } from '../../types/navigation';
import { OverviewPanel } from '../../panels/OverviewPanel';
import { WorkspacePanel } from '../../panels/WorkspacePanel';

type MainContentProps = {
  activeNav: NavItem;
  onNavigate: (nav: NavItem) => void;
};

export function MainContent({ activeNav, onNavigate }: MainContentProps) {
  const isWorkspace = activeNav === NavItem.WORKSPACE;

  return (
    <main className={`main-content ${isWorkspace ? 'main-content--workspace' : ''}`}>
      {activeNav === NavItem.OVERVIEW && (
        <OverviewPanel onOpenWorkspace={() => onNavigate(NavItem.WORKSPACE)} />
      )}
      {isWorkspace && <WorkspacePanel />}
    </main>
  );
}
