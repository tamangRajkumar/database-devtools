import { ScrollView, Text, View } from 'react-native';
import { explorerStyles } from './mobileExplorerStyles';

type MobileDataTableProps = {
  columns: string[];
  rows: (string | number | null)[][];
};

export function MobileDataTable({ columns, rows }: MobileDataTableProps) {
  if (columns.length === 0) {
    return <Text style={explorerStyles.placeholder}>No rows to display.</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <View>
        <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9' }}>
          {columns.map((column) => (
            <Cell key={column} header value={column} />
          ))}
        </View>
        <ScrollView style={{ maxHeight: 360 }}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: 'row' }}>
              {row.map((cell, cellIndex) => (
                <Cell
                  key={`${rowIndex}-${cellIndex}`}
                  value={cell === null ? 'NULL' : String(cell)}
                  nullValue={cell === null}
                />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

function Cell({
  value,
  header = false,
  nullValue = false,
}: {
  value: string;
  header?: boolean;
  nullValue?: boolean;
}) {
  return (
    <View
      style={{
        minWidth: 120,
        maxWidth: 200,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e2e8f0',
      }}
    >
      <Text
        numberOfLines={3}
        selectable
        style={{
          fontSize: header ? 12 : 13,
          fontWeight: header ? '700' : '400',
          color: nullValue ? '#94a3b8' : '#0f172a',
          fontFamily: header ? 'monospace' : undefined,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
