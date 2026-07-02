import { NavItem } from '../../types/navigation';
import { OverviewPanel } from '../../panels/OverviewPanel';
import { WorkspacePanel } from '../../panels/WorkspacePanel';

type MainContentProps = {
  activeNav: NavItem;
};

export function MainContent({ activeNav }: MainContentProps) {
  const isWorkspace = activeNav === NavItem.WORKSPACE;

  return (
    <main className={`main-content ${isWorkspace ? 'main-content--workspace' : ''}`}>
      {activeNav === NavItem.OVERVIEW && <OverviewPanel />}
      {isWorkspace && <WorkspacePanel />}
    </main>
  );
}
