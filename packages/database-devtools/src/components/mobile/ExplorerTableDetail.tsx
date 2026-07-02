import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ColumnInfo, TablePageResult } from '../../types/inspection';
import type { MobileDatabaseInspector } from '../../mobile/types';
import { DEFAULT_PAGE_SIZE } from '../../mobile/constants';
import { MobileDataView } from './MobileDataView';
import { explorerStyles, tableStyles } from './mobileExplorerStyles';

type ExplorerTableDetailProps = {
  inspector: MobileDatabaseInspector;
  tableName: string;
  onBack: () => void;
};

type DetailView = 'data' | 'schema';

export function ExplorerTableDetail({ inspector, tableName, onBack }: ExplorerTableDetailProps) {
  const [view, setView] = useState<DetailView>('data');
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [pageResult, setPageResult] = useState<TablePageResult | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextColumns = await inspector.getTableColumns(tableName);
      setColumns(nextColumns);

      const result = await inspector.fetchTablePage({
        table: tableName,
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        search,
      });

      setPageResult(result);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load table');
    } finally {
      setLoading(false);
    }
  }, [inspector, page, search, tableName]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalPages = pageResult
    ? Math.max(1, Math.ceil(pageResult.totalCount / pageResult.pageSize))
    : 1;

  return (
    <View style={explorerStyles.fullScreen}>
      <View style={explorerStyles.header}>
        <Pressable onPress={onBack}>
          <Text style={explorerStyles.headerAction}>← Back</Text>
        </Pressable>
        <Text style={explorerStyles.headerTitle}>{tableName}</Text>
        <View style={{ width: 48 }} />
      </View>

      <View style={[explorerStyles.subTabRow, { paddingHorizontal: 16, paddingTop: 12 }]}>
        <Pressable
          onPress={() => setView('data')}
          style={[explorerStyles.subTab, view === 'data' && explorerStyles.subTabActive]}
        >
          <Text style={[explorerStyles.subTabLabel, view === 'data' && explorerStyles.subTabLabelActive]}>
            Data
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setView('schema')}
          style={[explorerStyles.subTab, view === 'schema' && explorerStyles.subTabActive]}
        >
          <Text
            style={[explorerStyles.subTabLabel, view === 'schema' && explorerStyles.subTabLabelActive]}
          >
            Schema
          </Text>
        </Pressable>
      </View>

      {view === 'data' ? (
        <View style={tableStyles.detailBody}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Search rows…"
            style={explorerStyles.searchInput}
            value={search}
          />

          {loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} />
          ) : error ? (
            <Text style={explorerStyles.errorText}>{error}</Text>
          ) : pageResult ? (
            <>
              <View style={tableStyles.detailDataPane}>
                <MobileDataView
                  columns={pageResult.columns}
                  dataKey={`${tableName}-${page}-${search}`}
                  defaultMode="table"
                  metaSuffix={`page ${page} of ${totalPages}`}
                  rows={pageResult.rows}
                />
              </View>
              <View style={explorerStyles.paginationRow}>
                <Pressable disabled={page <= 1} onPress={() => setPage((current) => current - 1)}>
                  <Text style={explorerStyles.headerAction}>Previous</Text>
                </Pressable>
                <Text style={explorerStyles.paginationLabel}>
                  Page {page} of {totalPages} · {pageResult.totalCount.toLocaleString()} rows
                </Text>
                <Pressable
                  disabled={page >= totalPages}
                  onPress={() => setPage((current) => current + 1)}
                >
                  <Text style={explorerStyles.headerAction}>Next</Text>
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      ) : (
        <ScrollView contentContainerStyle={explorerStyles.content}>
          {columns.length === 0 ? (
            <Text style={explorerStyles.placeholder}>No schema information.</Text>
          ) : (
            columns.map((column) => (
              <View key={column.name} style={explorerStyles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={explorerStyles.listItemTitle}>{column.name}</Text>
                  <Text style={explorerStyles.listItemMeta}>
                    {column.type}
                    {column.pk ? ' · PK' : ''}
                    {column.notNull ? ' · NOT NULL' : ''}
                    {column.defaultValue ? ` · DEFAULT ${column.defaultValue}` : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
