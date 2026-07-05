import { createRequire } from 'node:module';
import { vi } from 'vitest';
import { configureSqliteWasm } from './src/inspectors/sqlite/sqlModule';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  StyleSheet: { create: (styles: unknown) => styles },
  View: 'View',
  useWindowDimensions: () => ({ width: 390, height: 844 }),
  PanResponder: { create: () => ({ panHandlers: {} }) },
  Pressable: 'Pressable',
  Modal: 'Modal',
  Text: 'Text',
  ActivityIndicator: 'ActivityIndicator',
  ScrollView: 'ScrollView',
  TextInput: 'TextInput',
  FlatList: 'FlatList',
}));

vi.mock('expo-constants', () => ({
  default: {},
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
  },
}));

const require = createRequire(import.meta.url);
const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');

configureSqliteWasm(() => wasmPath);
