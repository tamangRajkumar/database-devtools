#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.resolve(packageRoot, '../../apps/example');
const outputRoot = mkdtempSync(path.join(os.tmpdir(), 'database-devtools-metro-'));
const packageManagerCli = process.env.npm_execpath;
const command = packageManagerCli ? process.execPath : 'pnpm';
const commandPrefix = packageManagerCli ? [packageManagerCli] : [];

function bundlePlatform(platform) {
  console.log(`[database-devtools] Bundling Expo fixture for ${platform}...`);

  const result = spawnSync(
    command,
    [
      ...commandPrefix,
      'exec',
      'expo',
      'export',
      '--platform',
      platform,
      '--output-dir',
      path.join(outputRoot, platform),
      '--clear',
    ],
    {
      cwd: fixtureRoot,
      env: {
        ...process.env,
        CI: '1',
        DATABASE_DEVTOOLS_USE_DIST: '1',
      },
      stdio: 'inherit',
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Expo ${platform} fixture bundle failed with exit code ${result.status}`);
  }
}

try {
  bundlePlatform('android');
  bundlePlatform('ios');
  console.log('[database-devtools] Metro fixture verification passed');
} finally {
  rmSync(outputRoot, { recursive: true, force: true });
}
