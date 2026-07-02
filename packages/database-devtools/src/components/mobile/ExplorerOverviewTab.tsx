import { Pressable, ScrollView, Text, View } from 'react-native';
import type { MobileDatabaseInfo } from '../../mobile/types';
import { explorerStyles } from './mobileExplorerStyles';

type ExplorerOverviewTabProps = {
  info: MobileDatabaseInfo | null;
  loading: boolean;
  error: string | null;
  onOpenTables: () => void;
  onOpenSql: () => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ExplorerOverviewTab({
  info,
  loading,
  error,
  onOpenTables,
  onOpenSql,
}: ExplorerOverviewTabProps) {
  if (loading) {
    return <Text style={explorerStyles.placeholder}>Loading database info…</Text>;
  }

  if (error) {
    return <Text style={explorerStyles.errorText}>{error}</Text>;
  }

  if (!info) {
    return <Text style={explorerStyles.placeholder}>No database information available.</Text>;
  }

  return (
    <ScrollView contentContainerStyle={explorerStyles.content}>
      <Text style={explorerStyles.sectionTitle}>Database</Text>
      <Info label="Name" value={info.name} />
      <Info label="Path" value={info.path} mono />
      <Info label="SQLite version" value={info.sqliteVersion} />
      <Info label="Tables" value={String(info.tableCount)} />
      <Info label="Estimated size" value={formatBytes(info.estimatedSizeBytes)} />
      <Info
        label="Pages"
        value={`${info.pageCount.toLocaleString()} × ${info.pageSize} bytes`}
      />

      <View style={{ height: 16 }} />
      <Text style={explorerStyles.sectionTitle}>Quick actions</Text>
      <View style={{ gap: 8 }}>
        <ActionButton label="Browse tables" onPress={onOpenTables} />
        <ActionButton label="Run SQL query" onPress={onOpenSql} />
      </View>
    </ScrollView>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={explorerStyles.infoRow}>
      <Text style={explorerStyles.infoLabel}>{label}</Text>
      <Text style={[explorerStyles.infoValue, mono && explorerStyles.mono]} selectable>
        {value}
      </Text>
    </View>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={explorerStyles.ghostButton}>
      <Text style={explorerStyles.ghostButtonLabel}>{label}</Text>
    </Pressable>
  );
}
