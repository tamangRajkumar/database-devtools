import { describe, expect, it } from 'vitest';
import { formatAdapterResolutionMessage } from './errors';

describe('formatAdapterResolutionMessage', () => {
  it('lists supported databases and install instructions', () => {
    const message = formatAdapterResolutionMessage(
      [{ kind: 'sqlite', displayName: 'SQLite' }],
      'install-package',
    );

    expect(message).toContain('Unable to determine the database type');
    expect(message).toContain('SQLite');
    expect(message).toContain('type="sqlite"');
    expect(message).toContain('npm install expo-sqlite');
  });
});
