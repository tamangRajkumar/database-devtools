import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  computeColumnWidths,
  totalTableWidth,
} from '../../mobile/computeColumnWidths';
import { MobileDataCardList } from './MobileDataCardList';
import { MobileDataTable } from './MobileDataTable';
import { explorerStyles, tableStyles } from './mobileExplorerStyles';

export type MobileDataViewMode = 'table' | 'cards';

type MobileDataViewProps = {
  columns: string[];
  rows: (string | number | null)[][];
  metaSuffix?: string;
  defaultMode?: MobileDataViewMode;
  dataKey?: string;
};

export function MobileDataView({
  columns,
  rows,
  metaSuffix,
  defaultMode = 'table',
  dataKey,
}: MobileDataViewProps) {
  const [mode, setMode] = useState<MobileDataViewMode>(defaultMode);

  const columnWidths = useMemo(() => computeColumnWidths(columns, rows), [columns, rows]);
  const tableWidth = useMemo(() => totalTableWidth(columnWidths), [columnWidths]);
  const columnsKey = columns.join('|');

  useEffect(() => {
    setMode(defaultMode);
  }, [columnsKey, dataKey, defaultMode, rows.length]);

  if (columns.length === 0) {
    return <Text style={explorerStyles.placeholder}>No rows to display.</Text>;
  }

  const meta = `${rows.length} row${rows.length === 1 ? '' : 's'} · ${columns.length} column${
    columns.length === 1 ? '' : 's'
  }${metaSuffix ? ` · ${metaSuffix}` : ''}`;

  return (
    <View style={tableStyles.viewRoot}>
      <View style={tableStyles.viewToolbar}>
        <Text style={tableStyles.viewMeta}>{meta}</Text>
        <View style={tableStyles.viewToggle}>
          <Pressable
            onPress={() => setMode('cards')}
            style={[tableStyles.viewToggleButton, mode === 'cards' && tableStyles.viewToggleButtonActive]}
          >
            <Text
              style={[tableStyles.viewToggleLabel, mode === 'cards' && tableStyles.viewToggleLabelActive]}
            >
              Cards
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('table')}
            style={[tableStyles.viewToggleButton, mode === 'table' && tableStyles.viewToggleButtonActive]}
          >
            <Text
              style={[tableStyles.viewToggleLabel, mode === 'table' && tableStyles.viewToggleLabelActive]}
            >
              Table
            </Text>
          </Pressable>
        </View>
      </View>

      {mode === 'cards' ? (
        <MobileDataCardList columns={columns} rows={rows} />
      ) : (
        <MobileDataTable columnWidths={columnWidths} columns={columns} rows={rows} />
      )}

      {mode === 'table' && tableWidth > 320 && (
        <Text style={tableStyles.footerHint}>Tap a cell to copy its value</Text>
      )}
      {mode === 'cards' && (
        <Text style={tableStyles.footerHint}>Tap a field to copy its value</Text>
      )}
    </View>
  );
}
