import { NavItem } from '../../types/navigation';
import { useExplorer } from '../../context/ExplorerContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { GettingStartedChecklist } from '../onboarding/GettingStartedChecklist';
import { OverviewPanel } from '../../panels/OverviewPanel';
import { WorkspacePanel } from '../../panels/WorkspacePanel';

type MainContentProps = {
  activeNav: NavItem;
  onNavigate: (nav: NavItem) => void;
};

export function MainContent({ activeNav, onNavigate }: MainContentProps) {
  const isWorkspace = activeNav === NavItem.WORKSPACE;
  const isOverview = activeNav === NavItem.OVERVIEW;
  const { setBottomPanelTab } = useWorkspace();
  const { setSelectedTable, setView } = useExplorer();

  const openWorkspace = () => onNavigate(NavItem.WORKSPACE);

  const openBrowseTables = () => {
    onNavigate(NavItem.WORKSPACE);
    setBottomPanelTab('data');
  };

  const openRunSql = () => {
    onNavigate(NavItem.WORKSPACE);
    setBottomPanelTab('results');
  };

  const openBrowseTable = (tableName: string) => {
    onNavigate(NavItem.WORKSPACE);
    setSelectedTable(tableName);
    setView('data');
    setBottomPanelTab('data');
  };

  return (
    <main
      className={`main-content ${isWorkspace ? 'main-content--workspace' : ''} ${isOverview ? 'main-content--overview' : ''}`}
    >
      {isOverview && (
        <div className="overview-page">
          <GettingStartedChecklist onOpenWorkspace={openWorkspace} />
          <OverviewPanel
            onBrowseTable={openBrowseTable}
            onBrowseTables={openBrowseTables}
            onOpenWorkspace={openWorkspace}
            onRunSql={openRunSql}
          />
        </div>
      )}
      {isWorkspace && <WorkspacePanel />}
    </main>
  );
}
