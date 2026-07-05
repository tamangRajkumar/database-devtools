#!/usr/bin/env node
/**
 * Builds the browser hub UI into dist/web and copies a stable sql-wasm.wasm fallback.
 * Invoked after tsup (build:lib) as part of the package `build` script.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const monorepoRoot = path.resolve(packageRoot, '../..');
const webDir = path.join(monorepoRoot, 'apps', 'web');
const webDist = path.join(packageRoot, 'dist', 'web');

console.log('[database-devtools] Building browser UI…');

const build = spawnSync('pnpm', ['run', 'build'], {
  cwd: webDir,
  stdio: 'inherit',
  shell: true,
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

if (!existsSync(path.join(webDist, 'index.html'))) {
  console.error('[database-devtools] dist/web/index.html missing after web build');
  process.exit(1);
}

const assetsDir = path.join(webDist, 'assets');

if (!existsSync(assetsDir)) {
  console.error('[database-devtools] dist/web/assets missing after web build');
  process.exit(1);
}

const wasmFile = readdirSync(assetsDir).find(
  (file) => file.startsWith('sql-wasm') && file.endsWith('.wasm'),
);

if (!wasmFile) {
  console.error('[database-devtools] No sql-wasm*.wasm in dist/web/assets');
  process.exit(1);
}

const stableWasmPath = path.join(webDist, 'sql-wasm.wasm');
copyFileSync(path.join(assetsDir, wasmFile), stableWasmPath);
console.log(`[database-devtools] Copied assets/${wasmFile} → dist/web/sql-wasm.wasm`);
console.log('[database-devtools] Browser UI build complete');
