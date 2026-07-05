import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
  const [resultKey, setResultKey] = useState(0);

  const runQuery = async () => {
    setRunning(true);
    setError(null);

    try {
      const queryResult = await inspector.executeQuery(sql);
      setResult(queryResult);
      setResultKey((current) => current + 1);
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

  const renderResultsContent = () => {
    if (panel === 'output') {
      if (error) {
        return <Text style={explorerStyles.errorText}>{error}</Text>;
      }

      if (result) {
        return (
          <Text style={explorerStyles.infoValue}>
            Query executed successfully. {result.rowCount} row
            {result.rowCount === 1 ? '' : 's'} in {result.durationMs.toFixed(1)} ms.
          </Text>
        );
      }

      return <Text style={explorerStyles.placeholder}>Messages and errors appear here.</Text>;
    }

    if (!result) {
      return (
        <View style={explorerStyles.sqlResultsEmpty}>
          <Text style={[explorerStyles.placeholder, { marginTop: 0 }]}>
            Run a query to see results.
          </Text>
        </View>
      );
    }

    if (result.columns.length === 0) {
      return (
        <View style={explorerStyles.sqlResultsEmpty}>
          <Text style={[explorerStyles.placeholder, { marginTop: 0 }]}>
            Query completed with no result set ({result.durationMs.toFixed(1)} ms).
          </Text>
        </View>
      );
    }

    return (
      <MobileDataView
        columns={result.columns}
        dataKey={String(resultKey)}
        defaultMode="table"
        metaSuffix={`${result.durationMs.toFixed(1)} ms`}
        rows={result.rows}
      />
    );
  };

  return (
    <View style={explorerStyles.sqlTabRoot}>
      <View style={explorerStyles.sqlQueryPane}>
        <Text style={explorerStyles.sectionTitle}>SQL (read-only)</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          onChangeText={setSql}
          scrollEnabled
          style={explorerStyles.sqlInputCompact}
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
        <Text style={[explorerStyles.hintText, { marginTop: 0 }]}>
          Allowed: SELECT, PRAGMA, EXPLAIN, WITH. Writes are blocked in DevTools.
        </Text>
      </View>

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

      <View style={explorerStyles.sqlResultsPane}>{renderResultsContent()}</View>
    </View>
  );
}
