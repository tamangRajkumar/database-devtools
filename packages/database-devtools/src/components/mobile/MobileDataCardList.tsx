import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { isMonospaceColumn } from '../../mobile/computeColumnWidths';
import { copyToClipboard } from '../../mobile/copyToClipboard';
import { tableStyles } from './mobileExplorerStyles';

type MobileDataCardListProps = {
  columns: string[];
  rows: (string | number | null)[][];
};

function formatValue(value: string | number | null): string {
  return value === null ? 'NULL' : String(value);
}

export function MobileDataCardList({ columns, rows }: MobileDataCardListProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyValue = async (value: string, key: string) => {
    await copyToClipboard(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(_, index) => String(index)}
      contentContainerStyle={tableStyles.cardList}
      style={tableStyles.bodyList}
      renderItem={({ item: row, index: rowIndex }) => (
        <View style={tableStyles.card}>
          {columns.map((column, columnIndex) => {
            const value = formatValue(row[columnIndex] ?? null);
            const key = `${rowIndex}-${column}`;
            const isNull = row[columnIndex] === null;

            return (
              <Pressable
                key={key}
                onPress={() => void copyValue(value, key)}
                style={tableStyles.cardField}
              >
                <Text style={tableStyles.cardLabel}>{column}</Text>
                <Text
                  style={[
                    tableStyles.cardValue,
                    isMonospaceColumn(column) && tableStyles.cardValueMono,
                    isNull && tableStyles.cellNull,
                  ]}
                >
                  {value}
                </Text>
                {copiedKey === key && <Text style={tableStyles.copiedHint}>Copied</Text>}
              </Pressable>
            );
          })}
        </View>
      )}
    />
  );
}
