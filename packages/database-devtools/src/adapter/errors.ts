import type { DatabaseKind } from '../types/kind';

export type SupportedDatabase = {
  kind: DatabaseKind;
  displayName: string;
};

export class AdapterResolutionError extends Error {
  readonly name = 'AdapterResolutionError';

  constructor(
    public readonly supported: SupportedDatabase[],
    public readonly hint: 'type' | 'adapter' | 'install-package',
  ) {
    super(formatAdapterResolutionMessage(supported, hint));
  }
}

export function formatAdapterResolutionMessage(
  supported: SupportedDatabase[],
  hint: 'type' | 'adapter' | 'install-package',
): string {
  const lines = [
    'Unable to determine the database type.',
    '',
    'Supported databases:',
    ...supported.map((entry) => `  • ${entry.displayName}`),
    '',
    'Try specifying a type:',
    '  <DatabaseDevTools database={db} type="sqlite" />',
    '',
    'Or provide a custom adapter:',
    '  <DatabaseDevTools database={db} adapter={myAdapter} />',
  ];

  if (hint === 'install-package') {
    lines.push(
      '',
      'If you use SQLite, install the adapter package:',
      '  npm install @database-devtools/sqlite',
    );
  }

  return lines.join('\n');
}
