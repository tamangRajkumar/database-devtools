import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { DatabaseDevTools } from 'database-devtools';
import { usePersistedFloatingPosition } from './usePersistedFloatingPosition';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function seedDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      booked_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    INSERT OR IGNORE INTO users (id, email, name) VALUES
      (1, 'ada@example.com', 'Ada Lovelace'),
      (2, 'grace@example.com', 'Grace Hopper');

    INSERT OR IGNORE INTO bookings (id, user_id, title, status) VALUES
      (1, 1, 'Conference keynote', 'confirmed'),
      (2, 1, 'Workshop', 'pending'),
      (3, 2, 'Team offsite', 'confirmed');
    `);
  });
}

async function openExampleDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync('devtools-example.db');
      await seedDatabase(db);
      return db;
    })();
  }

  return databasePromise;
}

export default function App() {
  const [database, setDatabase] = useState<SQLite.SQLiteDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hostTapCount, setHostTapCount] = useState(0);
  const { floatingPosition, onFloatingPositionChange, ready } = usePersistedFloatingPosition();

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const db = await openExampleDatabase();

        if (!active) {
          return;
        }

        setDatabase(db);
      } catch (initError) {
        if (!active) {
          return;
        }

        setError(initError instanceof Error ? initError.message : 'Failed to open database');
      }
    }

    void init();

    return () => {
      active = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My App</Text>
      <Text style={styles.subtitle}>
        Drag the DB button. Tap to view the database or connect to web DevTools.
      </Text>

      <Pressable
        accessibilityLabel="Test host application touch"
        onPress={() => setHostTapCount((count) => count + 1)}
        style={({ pressed }) => [styles.hostButton, pressed && styles.hostButtonPressed]}
        testID="host-touch-target"
      >
        <Text style={styles.hostButtonLabel}>Test host app touch</Text>
        <Text style={styles.hostTapCount} testID="host-touch-count">
          Taps: {hostTapCount}
        </Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}
      {!database && !error && <ActivityIndicator size="large" />}

      {database && ready && (
        <DatabaseDevTools
          database={database}
          draggable
          floatingPosition={floatingPosition}
          onFloatingPositionChange={onFloatingPositionChange}
          snapToEdges
        />
      )}
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
    marginBottom: 16,
  },
  hostButton: {
    minWidth: 220,
    minHeight: 64,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  hostButtonPressed: {
    opacity: 0.8,
  },
  hostButtonLabel: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '600',
  },
  hostTapCount: {
    color: '#dbeafe',
    fontSize: 13,
    marginTop: 4,
  },
  error: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
  },
});
