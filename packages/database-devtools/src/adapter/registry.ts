import { readDatabaseKindMarker } from '../types/kind';
import type { AdapterDefinition } from './types';

export class AdapterRegistry {
  private readonly definitions = new Map<string, AdapterDefinition>();

  register(definition: AdapterDefinition): void {
    this.definitions.set(definition.kind, definition);
  }

  get(kind: string): AdapterDefinition | undefined {
    return this.definitions.get(kind);
  }

  listSupported(): { kind: string; displayName: string }[] {
    return [...this.definitions.values()]
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
      .map((definition) => ({
        kind: definition.kind,
        displayName: definition.displayName,
      }));
  }

  detect(database: unknown): AdapterDefinition | undefined {
    const markerKind = readDatabaseKindMarker(database);

    if (markerKind) {
      const marked = this.definitions.get(markerKind);

      if (marked) {
        return marked;
      }
    }

    const matches = [...this.definitions.values()]
      .filter((definition) => {
        try {
          return definition.detect(database);
        } catch {
          return false;
        }
      })
      .sort((left, right) => right.priority - left.priority);

    return matches[0];
  }
}

let globalRegistry: AdapterRegistry | null = null;

export function getAdapterRegistry(): AdapterRegistry {
  if (!globalRegistry) {
    globalRegistry = new AdapterRegistry();
  }

  return globalRegistry;
}

export function resetAdapterRegistry(): void {
  globalRegistry = null;
}
