import { NavItem } from '../../types/navigation';
import { OverviewPanel } from '../../panels/OverviewPanel';
import { QueryPanel } from '../../panels/QueryPanel';
import { SchemaPanel } from '../../panels/SchemaPanel';
import { TablesPanel } from '../../panels/TablesPanel';

type MainContentProps = {
  activeNav: NavItem;
};

export function MainContent({ activeNav }: MainContentProps) {
  return (
    <main className="main-content">
      {activeNav === NavItem.OVERVIEW && <OverviewPanel />}
      {activeNav === NavItem.TABLES && <TablesPanel />}
      {activeNav === NavItem.QUERY && <QueryPanel />}
      {activeNav === NavItem.SCHEMA && <SchemaPanel />}
    </main>
  );
}
