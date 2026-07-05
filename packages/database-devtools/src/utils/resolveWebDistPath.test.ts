import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveWebDistPath } from './resolveWebDistPath';

describe('resolveWebDistPath', () => {
  it('resolves web assets from the CLI bundle directory', () => {
    const cliDir = path.resolve('dist');
    const resolved = resolveWebDistPath(cliDir);

    if (resolved) {
      expect(resolved.endsWith(path.join('dist', 'web'))).toBe(true);
    }
  });

  it('resolves web assets from the CLI source directory', () => {
    const sourceCliDir = path.resolve('src/cli');
    const resolved = resolveWebDistPath(sourceCliDir);

    if (resolved) {
      expect(resolved.endsWith(path.join('dist', 'web'))).toBe(true);
    }
  });
});
