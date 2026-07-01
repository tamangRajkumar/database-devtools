# Custom adapters

For unsupported database engines, implement `DatabaseAdapter`:

```typescript
import type { DatabaseAdapter, SnapshotExport } from 'database-devtools';

export function createMyAdapter(db: MyDatabase): DatabaseAdapter {
  return {
    kind: 'my-engine',
    dialect: 'my-engine',
    id: 'my-db',
    name: 'My Database',
    capabilities: {
      exportSnapshot: true,
      executeQuery: false,
      listTables: false,
      getSchema: false,
      transactionalWrites: false,
      observeChanges: false,
      importSnapshot: false,
    },
    async exportSnapshot(): Promise<SnapshotExport> {
      return {
        bytes: await db.exportBytes(),
        mimeType: 'application/x-my-engine',
        kind: 'my-engine',
      };
    },
  };
}
```

Use with:

```tsx
<DatabaseDevTools database={db} adapter={createMyAdapter(db)} />
```

For browser inspection, register a matching `DatabaseInspector` via `getInspectorRegistry()`.

## Register for auto-detection

```typescript
import { getAdapterRegistry, type AdapterDefinition } from 'database-devtools/adapter';

export const myAdapterDefinition: AdapterDefinition = {
  kind: 'my-engine',
  displayName: 'My Engine',
  priority: 50,
  detect: (db) => isMyDatabase(db),
  create: (db) => createMyAdapter(db),
};

getAdapterRegistry().register(myAdapterDefinition);
```
