import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useDevTools } from '../../hooks/useDevTools';
import type { MobileDatabaseInfo } from '../../mobile/types';
import type { TableInfo } from '../../types/inspection';
import { ExplorerOverviewTab } from './ExplorerOverviewTab';
import { ExplorerSqlTab } from './ExplorerSqlTab';
import { ExplorerTableDetail } from './ExplorerTableDetail';
import { ExplorerTablesTab } from './ExplorerTablesTab';
import { explorerStyles } from './mobileExplorerStyles';

type ExplorerTab = 'overview' | 'tables' | 'sql';

type ExplorerScreen =
  | { kind: 'tabs' }
  | { kind: 'table'; tableName: string };

export function MobileDatabaseExplorer() {
  const { explorerVisible, closeExplorer, mobileInspector } = useDevTools();
  const [tab, setTab] = useState<ExplorerTab>('overview');
  const [screen, setScreen] = useState<ExplorerScreen>({ kind: 'tabs' });
  const [info, setInfo] = useState<MobileDatabaseInfo | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    if (!mobileInspector) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [nextInfo, nextTables] = await Promise.all([
        mobileInspector.getDatabaseInfo(),
        mobileInspector.listTables(),
      ]);
      setInfo(nextInfo);
      setTables(nextTables);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load database');
    } finally {
      setLoading(false);
    }
  }, [mobileInspector]);

  useEffect(() => {
    if (!explorerVisible) {
      setScreen({ kind: 'tabs' });
      setTab('overview');
      return;
    }

    void loadOverview();
  }, [explorerVisible, loadOverview]);

  if (!mobileInspector) {
    return null;
  }

  return (
    <Modal animationType="slide" onRequestClose={closeExplorer} visible={explorerVisible}>
      {screen.kind === 'table' ? (
        <ExplorerTableDetail
          inspector={mobileInspector}
          onBack={() => setScreen({ kind: 'tabs' })}
          tableName={screen.tableName}
        />
      ) : (
        <View style={explorerStyles.fullScreen}>
          <View style={explorerStyles.header}>
            <Text style={explorerStyles.headerTitle}>Database Explorer</Text>
            <Pressable accessibilityLabel="Close database explorer" onPress={closeExplorer}>
              <Text style={explorerStyles.headerAction}>Close</Text>
            </Pressable>
          </View>

          <View style={explorerStyles.tabRow}>
            {(['overview', 'tables', 'sql'] as ExplorerTab[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => setTab(item)}
                style={[explorerStyles.tab, tab === item && explorerStyles.tabActive]}
              >
                <Text
                  style={[explorerStyles.tabLabel, tab === item && explorerStyles.tabLabelActive]}
                >
                  {item === 'overview' ? 'Overview' : item === 'tables' ? 'Tables' : 'SQL'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flex: 1 }}>
            {tab === 'overview' && (
              <ExplorerOverviewTab
                error={error}
                info={info}
                loading={loading}
                onOpenSql={() => setTab('sql')}
                onOpenTables={() => setTab('tables')}
              />
            )}
            {tab === 'tables' && (
              <ExplorerTablesTab
                error={error}
                loading={loading}
                onSelectTable={(tableName) => setScreen({ kind: 'table', tableName })}
                tables={tables}
              />
            )}
            {tab === 'sql' && <ExplorerSqlTab inspector={mobileInspector} />}
          </View>
        </View>
      )}
    </Modal>
  );
}
