import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { QueryResult } from '../../types/inspection';
import type { MobileDatabaseInspector } from '../../mobile/types';
import { DEFAULT_MOBILE_SQL } from '../../mobile/constants';
import { MobileDataView } from './MobileDataView';
import { explorerStyles } from './mobileExplorerStyles';

type ExplorerSqlTabProps = {
  inspector: MobileDatabaseInspector;
};

export function ExplorerSqlTab({ inspector }: ExplorerSqlTabProps) {
  const [sql, setSql] = useState(DEFAULT_MOBILE_SQL);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [panel, setPanel] = useState<'results' | 'output'>('results');

  const runQuery = async () => {
    setRunning(true);
    setError(null);

    try {
      const queryResult = await inspector.executeQuery(sql);
      setResult(queryResult);
      setPanel('results');
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : 'Query failed';
      setError(message);
      setResult(null);
      setPanel('output');
    } finally {
      setRunning(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={explorerStyles.sectionTitle}>SQL (read-only)</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          onChangeText={setSql}
          style={explorerStyles.sqlInput}
          value={sql}
        />
        <Pressable
          disabled={running}
          onPress={() => void runQuery()}
          style={[explorerStyles.primaryButton, running && explorerStyles.primaryButtonDisabled]}
        >
          {running ? (
            <ActivityIndicator color="#f8fafc" />
          ) : (
            <Text style={explorerStyles.primaryButtonLabel}>Run query</Text>
          )}
        </Pressable>
        <Text style={explorerStyles.hintText}>
          Allowed: SELECT, PRAGMA, EXPLAIN, WITH. Writes are blocked in DevTools.
        </Text>
      </ScrollView>

      <View style={[explorerStyles.tabRow, { flexShrink: 0 }]}>
        <Pressable
          onPress={() => setPanel('results')}
          style={[explorerStyles.tab, panel === 'results' && explorerStyles.tabActive]}
        >
          <Text
            style={[explorerStyles.tabLabel, panel === 'results' && explorerStyles.tabLabelActive]}
          >
            Results{result ? ` (${result.rowCount})` : ''}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPanel('output')}
          style={[explorerStyles.tab, panel === 'output' && explorerStyles.tabActive]}
        >
          <Text
            style={[explorerStyles.tabLabel, panel === 'output' && explorerStyles.tabLabelActive]}
          >
            Output
          </Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, minHeight: 0, paddingHorizontal: 16, paddingBottom: 16 }}>
        {panel === 'results' ? (
          result ? (
            result.columns.length > 0 ? (
              <MobileDataView
                columns={result.columns}
                metaSuffix={`${result.durationMs.toFixed(1)} ms`}
                rows={result.rows}
              />
            ) : (
              <Text style={explorerStyles.placeholder}>
                Query completed with no result set ({result.durationMs.toFixed(1)} ms).
              </Text>
            )
          ) : (
            <Text style={explorerStyles.placeholder}>Run a query to see results.</Text>
          )
        ) : error ? (
          <Text style={explorerStyles.errorText}>{error}</Text>
        ) : result ? (
          <Text style={explorerStyles.infoValue}>
            Query executed successfully. {result.rowCount} row
            {result.rowCount === 1 ? '' : 's'} in {result.durationMs.toFixed(1)} ms.
          </Text>
        ) : (
          <Text style={explorerStyles.placeholder}>Messages and errors appear here.</Text>
        )}
      </View>
    </View>
  );
}
