import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TableInfo } from '../../types/inspection';
import { explorerStyles } from './mobileExplorerStyles';

type ExplorerTablesTabProps = {
  tables: TableInfo[];
  loading: boolean;
  error: string | null;
  onSelectTable: (tableName: string) => void;
};

export function ExplorerTablesTab({
  tables,
  loading,
  error,
  onSelectTable,
}: ExplorerTablesTabProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return tables;
    }

    return tables.filter((table) => table.name.toLowerCase().includes(term));
  }, [search, tables]);

  if (loading) {
    return <Text style={explorerStyles.placeholder}>Loading tables…</Text>;
  }

  if (error) {
    return <Text style={explorerStyles.errorText}>{error}</Text>;
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setSearch}
        placeholder="Filter tables…"
        style={explorerStyles.searchInput}
        value={search}
      />

      {filtered.length === 0 ? (
        <Text style={explorerStyles.placeholder}>No tables match your search.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.name}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => onSelectTable(item.name)} style={explorerStyles.listItem}>
              <View>
                <Text style={explorerStyles.listItemTitle}>{item.name}</Text>
                <Text style={explorerStyles.listItemMeta}>
                  {item.rowCount.toLocaleString()} row{item.rowCount === 1 ? '' : 's'}
                </Text>
              </View>
              <Text style={explorerStyles.listItemMeta}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
