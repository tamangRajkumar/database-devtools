import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useDevTools } from '../hooks/useDevTools';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';

export function DevToolsLauncherModal() {
  const {
    launcherVisible,
    closeLauncher,
    openExplorer,
    openSettings,
    connectionState,
    mobileInspector,
    exportState,
    exportError,
    exportDatabase,
    database,
    adapterError,
  } = useDevTools();

  if (!launcherVisible) {
    return null;
  }

  const isExporting = exportState === 'exporting';
  const exportDisabled =
    connectionState !== 'connected' || !database || isExporting || Boolean(adapterError);

  return (
    <Modal
      animationType="slide"
      onRequestClose={closeLauncher}
      transparent
      visible={launcherVisible}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Database DevTools</Text>
            <Pressable accessibilityLabel="Close launcher" onPress={closeLauncher}>
              <Text style={styles.closeButton}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.body}>
            <ConnectionStatusBadge state={connectionState} />
            <Text style={styles.hint}>
              Browse and query the on-device database, or connect to the web inspector.
            </Text>

            <Pressable
              accessibilityLabel="View database on device"
              disabled={!mobileInspector}
              onPress={openExplorer}
              style={[styles.primaryButton, !mobileInspector && styles.primaryButtonDisabled]}
            >
              <Text style={styles.primaryLabel}>View Database</Text>
            </Pressable>
            {!mobileInspector ? (
              <Text style={styles.warning}>
                On-device explorer requires an Expo SQLite database instance.
              </Text>
            ) : null}

            <Pressable
              accessibilityLabel="Open DevTools settings"
              onPress={openSettings}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryLabel}>DevTools Settings</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Export database to web inspector"
              accessibilityState={{ busy: isExporting, disabled: exportDisabled }}
              disabled={exportDisabled}
              onPress={() => void exportDatabase()}
              style={[styles.ghostButton, exportDisabled && !isExporting && styles.buttonDisabled]}
            >
              <View style={styles.exportContent}>
                {isExporting ? <ActivityIndicator color="#0f172a" size="small" /> : null}
                <Text style={styles.ghostLabel}>
                  {isExporting ? 'Exporting…' : 'Export to Web Inspector'}
                </Text>
              </View>
            </Pressable>

            {connectionState !== 'connected' ? (
              <Text style={styles.hint}>Connect to the hub in settings before exporting.</Text>
            ) : null}
            {exportState === 'success' ? (
              <Text style={styles.success}>Sent to web inspector</Text>
            ) : null}
            {exportError ? <Text style={styles.error}>{exportError}</Text> : null}
            {adapterError ? <Text style={styles.error}>{adapterError}</Text> : null}
          </View>
        </View>
      </View>
    </Modal>
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
    overflow: 'hidden',
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
  body: {
    padding: 20,
    gap: 12,
  },
  hint: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
  },
  warning: {
    fontSize: 12,
    color: '#b45309',
    marginTop: -4,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryLabel: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  ghostLabel: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  exportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  success: {
    fontSize: 13,
    color: '#15803d',
  },
  error: {
    fontSize: 13,
    color: '#dc2626',
  },
});
