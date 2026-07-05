import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      native: 'src/native.ts',
      'client/index': 'src/client/index.ts',
      'server/index': 'src/server/index.ts',
      'types/protocol': 'src/types/protocol.ts',
      'adapter/index': 'src/adapter/index.ts',
      'inspector/index': 'src/inspector/index.ts',
      'inspectors/sqlite/index': 'src/inspectors/sqlite/index.ts',
      'adapters/sqlite/index': 'src/adapters/sqlite/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: [
      'react',
      'react-native',
      'sql.js',
      'expo-constants',
      '@react-native-async-storage/async-storage',
      '@expo/vector-icons',
      '@expo/vector-icons/MaterialCommunityIcons',
      'expo-clipboard',
    ],
    treeshake: true,
  },
  {
    entry: { cli: 'src/cli/index.ts' },
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.js' };
    },
    format: ['cjs'],
    dts: false,
    sourcemap: true,
    clean: false,
    banner: { js: '#!/usr/bin/env node' },
    platform: 'node',
    external: ['express', 'ws'],
  },
]);
