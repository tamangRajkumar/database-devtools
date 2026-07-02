import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useDevTools } from '../hooks/useDevTools';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';

export function DevToolsSettingsModal() {
  const {
    settingsVisible,
    closeSettings,
    connectionState,
    connectionError,
    connectionHint,
    deviceId,
    serverUrl,
    metadata,
    database,
    adapterError,
    reconnect,
    exportState,
    exportError,
    exportDatabase,
  } = useDevTools();

  const [draftUrl, setDraftUrl] = useState(serverUrl);

  useEffect(() => {
    if (settingsVisible) {
      setDraftUrl(serverUrl);
    }
  }, [settingsVisible, serverUrl]);

  const handleReconnect = () => {
    const trimmed = draftUrl.trim();

    if (trimmed) {
      reconnect(trimmed);
    }
  };

  const handleExportDatabase = () => {
    void exportDatabase();
  };

  const isExporting = exportState === 'exporting';
  const exportDisabled =
    connectionState !== 'connected' || !database || isExporting;

  return (
    <Modal
      animationType="slide"
      onRequestClose={closeSettings}
      transparent
      visible={settingsVisible}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Database DevTools</Text>
            <Pressable accessibilityLabel="Close settings" onPress={closeSettings}>
              <Text style={styles.closeButton}>Close</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            style={styles.scrollBody}
          >
            <Section title="Connection">
              <ConnectionStatusBadge state={connectionState} />
              <InfoRow label="Server URL" value={serverUrl} mono />
              {connectionError ? (
                <Text style={styles.errorText}>{connectionError}</Text>
              ) : null}
              {connectionHint ? (
                <Text style={styles.hintText}>{connectionHint}</Text>
              ) : null}
              {connectionState === 'reconnecting' ? (
                <Text style={styles.hintText}>
                  Ensure the inspector hub is running (pnpm dev:cli) and the URL reaches your
                  development machine — not the phone itself.
                </Text>
              ) : null}
            </Section>

            <Section title="Device">
              <InfoRow label="Device ID" value={deviceId ?? '—'} mono />
              <InfoRow label="Platform" value={metadata.platform ?? '—'} />
              <InfoRow label="App" value={metadata.appName ?? '—'} />
              {metadata.appVersion ? (
                <InfoRow label="Version" value={metadata.appVersion} />
              ) : null}
              {metadata.bundleId ? (
                <InfoRow label="Bundle ID" value={metadata.bundleId} mono />
              ) : null}
            </Section>

            <Section title="Server">
              <Text style={styles.fieldLabel}>WebSocket URL</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setDraftUrl}
                placeholder="ws://10.0.2.2:3847/ws"
                style={styles.input}
                value={draftUrl}
              />
              <Pressable onPress={handleReconnect} style={styles.reconnectButton}>
                <Text style={styles.reconnectLabel}>Reconnect</Text>
              </Pressable>
            </Section>

            <Section title="Database">
              {database ? (
                <>
                  <InfoRow label="Kind" value={database.kind} />
                  <InfoRow label="Name" value={database.name} />
                  <InfoRow label="ID" value={database.id} mono />
                </>
              ) : (
                <Text style={styles.placeholder}>
                  {adapterError ? 'Adapter not connected' : 'No adapter connected'}
                </Text>
              )}
            </Section>
          </ScrollView>

          <View style={styles.exportFooter}>
            {adapterError ? <Text style={styles.errorText}>{adapterError}</Text> : null}
            {database ? (
              <>
                <Pressable
                  accessibilityLabel="Export database to web inspector"
                  accessibilityState={{ busy: isExporting, disabled: exportDisabled }}
                  disabled={exportDisabled}
                  onPress={handleExportDatabase}
                  style={[
                    styles.exportButton,
                    exportDisabled && !isExporting && styles.exportButtonDisabled,
                  ]}
                >
                  <View style={styles.exportButtonContent}>
                    {isExporting ? (
                      <ActivityIndicator color="#f8fafc" size="small" />
                    ) : null}
                    <Text style={styles.exportLabel}>
                      {isExporting ? 'Exporting…' : 'Export Database'}
                    </Text>
                  </View>
                </Pressable>
                {connectionState !== 'connected' ? (
                  <Text style={styles.hintText}>Connect to the hub before exporting.</Text>
                ) : null}
                {exportState === 'success' ? (
                  <Text style={styles.successText}>Sent to web inspector</Text>
                ) : null}
                {exportError ? <Text style={styles.errorText}>{exportError}</Text> : null}
              </>
            ) : (
              <Text style={styles.placeholder}>
                {adapterError ? 'Adapter not connected' : 'No adapter connected'}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.mono]} selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  scrollBody: {
    flexGrow: 0,
    flexShrink: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
  exportFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 14,
    color: '#0f172a',
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  reconnectButton: {
    marginTop: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  reconnectLabel: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  exportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportLabel: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  successText: {
    fontSize: 13,
    color: '#15803d',
  },
  placeholder: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#b45309',
    lineHeight: 18,
  },
});
