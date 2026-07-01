import type { DatabaseKind } from '../types/kind';
import type { DatabaseInspector, InspectorDefinition } from './types';

export class InspectorRegistry {
  private readonly definitions = new Map<string, InspectorDefinition>();

  register(definition: InspectorDefinition): void {
    this.definitions.set(definition.kind, definition);
  }

  get(kind: DatabaseKind): InspectorDefinition | undefined {
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

  detectFromBytes(bytes: ArrayBuffer): InspectorDefinition | undefined {
    return [...this.definitions.values()].find((definition) => definition.canOpenBytes?.(bytes));
  }

  detectFromSnapshot(input: { kind: DatabaseKind; mimeType: string }): InspectorDefinition | undefined {
    const byKind = this.definitions.get(input.kind);

    if (byKind) {
      return byKind;
    }

    return [...this.definitions.values()].find((definition) =>
      definition.mimeTypes.includes(input.mimeType),
    );
  }
}

let globalInspectorRegistry: InspectorRegistry | null = null;

export function getInspectorRegistry(): InspectorRegistry {
  if (!globalInspectorRegistry) {
    globalInspectorRegistry = new InspectorRegistry();
  }

  return globalInspectorRegistry;
}

export function resetInspectorRegistry(): void {
  globalInspectorRegistry = null;
}

export async function createInspectorForSnapshot(input: {
  kind: DatabaseKind;
  mimeType: string;
  bytes: ArrayBuffer;
}): Promise<DatabaseInspector> {
  const registry = getInspectorRegistry();
  const definition =
    registry.get(input.kind) ??
    registry.detectFromBytes(input.bytes) ??
    registry.detectFromSnapshot(input);

  if (!definition) {
    throw new Error(`No inspector registered for database kind "${input.kind}"`);
  }

  const inspector = await definition.createInspector();
  await inspector.open(input.bytes);
  return inspector;
}
