import { existsSync } from 'node:fs';
import path from 'node:path';

function collectWebDistCandidates(entryDir: string): string[] {
  const candidates: string[] = [];
  const envPath = process.env.DATABASE_DEVTOOLS_WEB_DIST?.trim();

  if (envPath) {
    candidates.push(path.resolve(envPath));
  }

  let current = path.resolve(entryDir);

  for (let depth = 0; depth < 8; depth += 1) {
    candidates.push(path.join(current, 'dist', 'web'));
    candidates.push(path.join(current, 'web'));

    const parent = path.dirname(current);

    if (parent === current) {
      break;
    }

    current = parent;
  }

  return candidates;
}

export function resolveWebDistPath(entryDir: string): string | undefined {
  const seen = new Set<string>();

  for (const candidate of collectWebDistCandidates(entryDir)) {
    const normalized = path.resolve(candidate);

    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);

    if (existsSync(path.join(normalized, 'index.html'))) {
      return normalized;
    }
  }

  return undefined;
}
