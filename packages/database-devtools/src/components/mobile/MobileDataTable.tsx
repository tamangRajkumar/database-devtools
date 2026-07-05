import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  computeColumnWidths,
  isMonospaceColumn,
  totalTableWidth,
} from '../../mobile/computeColumnWidths';
import { copyToClipboard } from '../../mobile/copyToClipboard';
import { tableStyles } from './mobileExplorerStyles';

type MobileDataTableProps = {
  columns: string[];
  rows: (string | number | null)[][];
  columnWidths?: number[];
};

function formatValue(value: string | number | null): string {
  return value === null ? 'NULL' : String(value);
}

export function MobileDataTable({ columns, rows, columnWidths: columnWidthsProp }: MobileDataTableProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const columnWidths = useMemo(
    () => columnWidthsProp ?? computeColumnWidths(columns, rows),
    [columnWidthsProp, columns, rows],
  );

  const tableWidth = useMemo(() => totalTableWidth(columnWidths), [columnWidths]);
  const showScrollHint = tableWidth > windowWidth - 32;

  const copyCell = async (value: string, key: string) => {
    await copyToClipboard(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  if (columns.length === 0) {
    return null;
  }

  const headerRow = (
    <View style={tableStyles.headerRow}>
      {columns.map((column, index) => (
        <View
          key={column}
          style={[tableStyles.cell, tableStyles.headerCell, { width: columnWidths[index] }]}
        >
          <Text style={tableStyles.headerText}>{column}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <View style={tableStyles.tableContainer}>
      {showScrollHint && (
        <Text style={tableStyles.scrollHint}>Swipe horizontally for more columns</Text>
      )}
      <ScrollView
        horizontal
        bounces={false}
        nestedScrollEnabled
        showsHorizontalScrollIndicator
        style={tableStyles.horizontalScroll}
      >
        <View style={{ width: tableWidth, flex: 1 }}>
          {headerRow}
          <FlatList
            data={rows}
            keyExtractor={(_, index) => String(index)}
            nestedScrollEnabled
            style={tableStyles.bodyList}
            renderItem={({ item: row, index: rowIndex }) => (
              <View style={[tableStyles.dataRow, rowIndex % 2 === 1 && tableStyles.dataRowAlt]}>
                {row.map((cell, cellIndex) => {
                  const column = columns[cellIndex]!;
                  const display = formatValue(cell);
                  const key = `${rowIndex}-${cellIndex}`;
                  const isNull = cell === null;

                  return (
                    <Pressable
                      key={key}
                      onPress={() => void copyCell(display, key)}
                      style={[tableStyles.cell, { width: columnWidths[cellIndex] }]}
                    >
                      <Text
                        numberOfLines={2}
                        selectable
                        style={[
                          tableStyles.cellText,
                          isMonospaceColumn(column) && tableStyles.cellTextMono,
                          isNull && tableStyles.cellNull,
                        ]}
                      >
                        {display}
                      </Text>
                      {copiedKey === key && <Text style={tableStyles.copiedHint}>Copied</Text>}
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
}
