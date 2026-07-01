import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { DatabaseDevTools } from 'database-devtools';
import type { DatabaseAdapter } from 'database-devtools';

const mockDb: DatabaseAdapter = {
  id: 'example',
  name: 'Example SQLite (stub)',
  async exportSnapshot() {
    const payload = JSON.stringify({
      adapter: 'example',
      tables: ['users', 'bookings', 'sessions'],
      exportedAt: Date.now(),
    });

    return new TextEncoder().encode(payload);
  },
};

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My App</Text>
      <Text style={styles.subtitle}>Tap the DB button to open DevTools settings</Text>
      <DatabaseDevTools database={mockDb} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
