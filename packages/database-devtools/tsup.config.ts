import { defineConfig } from 'tsup';

const libraryExternal = [
  'react',
  'react-native',
  'sql.js',
  'expo-constants',
  '@react-native-async-storage/async-storage',
  '@expo/vector-icons',
  '@expo/vector-icons/MaterialCommunityIcons',
  'expo-clipboard',
];

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
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
    external: libraryExternal,
    treeshake: true,
  },
  {
    entry: { native: 'src/native.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    external: libraryExternal,
    splitting: false,
    treeshake: true,
    esbuildOptions(options) {
      options.resolveExtensions = [
        '.native.tsx',
        '.native.ts',
        '.native.jsx',
        '.native.js',
        '.tsx',
        '.ts',
        '.jsx',
        '.js',
        '.css',
        '.json',
      ];
    },
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
