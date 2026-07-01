import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['database-devtools', 'database-devtools/inspector', 'sql.js'],
  treeshake: true,
});
