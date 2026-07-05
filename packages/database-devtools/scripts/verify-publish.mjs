#!/usr/bin/env node
/**
 * Ensures dist/ contains everything required for npm publish (lib + web UI + wasm).
 */
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webDist = path.join(packageRoot, 'dist', 'web');
const errors = [];

function requirePath(relativePath, label = relativePath) {
  const absolute = path.join(packageRoot, relativePath);

  if (!existsSync(absolute)) {
    errors.push(`${label} is missing`);
  }
}

requirePath('dist/native.js');
requirePath('dist/cli.cjs');
requirePath('dist/web/index.html', 'dist/web/index.html');
requirePath('dist/web/sql-wasm.wasm', 'dist/web/sql-wasm.wasm (stable wasm fallback)');

const assetsDir = path.join(webDist, 'assets');

if (!existsSync(assetsDir)) {
  errors.push('dist/web/assets/ is missing');
} else {
  const hasHashedWasm = readdirSync(assetsDir).some(
    (file) => file.startsWith('sql-wasm') && file.endsWith('.wasm'),
  );

  if (!hasHashedWasm) {
    errors.push('dist/web/assets/sql-wasm-*.wasm is missing');
  }
}

if (errors.length > 0) {
  console.error('[database-devtools] Publish verification failed:\n');
  errors.forEach((message) => console.error(`  - ${message}`));
  console.error('\nRun the full build before publishing:');
  console.error('  pnpm build   # from monorepo root');
  console.error('  # or: pnpm --filter database-devtools build');
  process.exit(1);
}

console.log('[database-devtools] Publish verification passed');
