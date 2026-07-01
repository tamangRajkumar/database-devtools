import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'client/index': 'src/client/index.ts',
      'server/index': 'src/server/index.ts',
      'types/protocol': 'src/types/protocol.ts',
      'adapter/index': 'src/adapter/index.ts',
      'inspector/index': 'src/inspector/index.ts',
      'adapters/sqlite/index': 'src/adapters/sqlite/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-native', '@database-devtools/inspector-sqlite'],
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
