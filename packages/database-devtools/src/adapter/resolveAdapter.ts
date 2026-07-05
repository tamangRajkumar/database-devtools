import type { DatabaseAdapter } from '../types/adapter';
import { AdapterResolutionError } from './errors';
import { getAdapterRegistry } from './registry';
import { registerBuiltInAdapters } from './registerBuiltins';
import type { ResolveAdapterOptions } from './types';

export async function resolveAdapter(
  database: unknown,
  options: ResolveAdapterOptions = {},
): Promise<DatabaseAdapter> {
  if (options.adapter) {
    return options.adapter;
  }

  if (!database) {
    throw new AdapterResolutionError([], 'adapter');
  }

  await registerBuiltInAdapters();

  const registry = getAdapterRegistry();

  if (options.type) {
    const definition = registry.get(options.type);

    if (!definition) {
      throw new AdapterResolutionError(registry.listSupported(), 'type');
    }

    return definition.create(database);
  }

  const detected = registry.detect(database);

  if (!detected) {
    throw new AdapterResolutionError(
      registry.listSupported(),
      registry.listSupported().length === 0 ? 'install-package' : 'type',
    );
  }

  return detected.create(database);
}
