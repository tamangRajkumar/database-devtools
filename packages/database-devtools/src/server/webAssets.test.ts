import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const webDist = path.join(packageRoot, 'dist', 'web');

describe('bundled web assets', () => {
  it('ships index.html and hashed wasm under dist/web/assets', () => {
    expect(existsSync(path.join(webDist, 'index.html'))).toBe(true);

    const assetsDir = path.join(webDist, 'assets');
    expect(existsSync(assetsDir)).toBe(true);

    const wasmFiles = readdirSync(assetsDir).filter(
      (file) => file.startsWith('sql-wasm') && file.endsWith('.wasm'),
    );

    expect(wasmFiles.length).toBeGreaterThan(0);
  });

  it('ships stable sql-wasm.wasm fallback at dist/web root', () => {
    expect(existsSync(path.join(webDist, 'sql-wasm.wasm'))).toBe(true);
  });
});
