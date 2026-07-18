import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import {
  act,
  create,
  type ReactTestRenderer,
} from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MobileDatabaseInspector } from '../mobile/types';
import { DatabaseDevTools } from './DatabaseDevTools';

vi.mock('./DevToolsProvider', async () => {
  const { DevToolsContext } = await import('../hooks/useDevTools');

  function TestDevToolsProvider({ children }: { children: ReactNode }) {
    const [activePanel, setActivePanel] = useState<
      'launcher' | 'settings' | 'explorer' | null
    >(null);
    const value = useMemo(
      () => ({
        connectionState: 'connected' as const,
        connectionError: null,
        connectionHint: null,
        deviceId: 'device-test',
        serverUrl: 'ws://localhost:3847/ws',
        metadata: { platform: 'test', appName: 'Test App' },
        database: undefined,
        adapterError: null,
        mobileInspector: {
          getDatabaseInfo: async () => ({
            name: 'test.db',
            path: '/test.db',
            tableCount: 0,
            sqliteVersion: '3.45.0',
            pageSize: 4096,
            pageCount: 1,
            estimatedSizeBytes: 4096,
          }),
          listTables: async () => [],
        } as unknown as MobileDatabaseInspector,
        launcherVisible: activePanel === 'launcher',
        openLauncher: () => setActivePanel('launcher'),
        closeLauncher: () => setActivePanel(null),
        explorerVisible: activePanel === 'explorer',
        openExplorer: () => setActivePanel('explorer'),
        closeExplorer: () => setActivePanel(null),
        settingsVisible: activePanel === 'settings',
        openSettings: () => setActivePanel('settings'),
        closeSettings: () => setActivePanel(null),
        reconnect: () => undefined,
        exportState: 'idle' as const,
        exportError: null,
        exportDatabase: async () => undefined,
      }),
      [activePanel],
    );

    return <DevToolsContext.Provider value={value}>{children}</DevToolsContext.Provider>;
  }

  return { DevToolsProvider: TestDevToolsProvider };
});

const hostPress = vi.fn();

async function renderHost(): Promise<ReactTestRenderer> {
  let renderer!: ReactTestRenderer;

  await act(async () => {
    renderer = create(
      <View>
        <Pressable onPress={hostPress} testID="host-control" />
        <DatabaseDevTools draggable={false} enabled />
      </View>,
    );
  });

  return renderer;
}

function modalCount(renderer: ReactTestRenderer): number {
  return renderer.root.findAll((node) => String(node.type) === 'Modal').length;
}

beforeEach(() => {
  hostPress.mockReset();
});

describe('DatabaseDevTools touch routing', () => {
  it('mounts no native Modal while closed and leaves host controls interactive', async () => {
    const renderer = await renderHost();
    const hostControl = renderer.root.findByProps({ testID: 'host-control' });
    const overlays = renderer.root.findAll(
      (node) => String(node.type) === 'View' && node.props.pointerEvents === 'box-none',
    );

    expect(modalCount(renderer)).toBe(0);
    expect(overlays.length).toBeGreaterThanOrEqual(1);

    act(() => {
      hostControl.props.onPress();
    });

    expect(hostPress).toHaveBeenCalledOnce();
  });

  it('opens only the launcher Modal from the database button and restores host touches', async () => {
    const renderer = await renderHost();
    const button = renderer.root.findByProps({
      accessibilityLabel: 'Open Database DevTools',
    });

    act(() => {
      button.props.onPress();
    });

    expect(modalCount(renderer)).toBe(1);

    const closeLauncher = renderer.root.findByProps({
      accessibilityLabel: 'Close launcher',
    });
    act(() => {
      closeLauncher.props.onPress();
    });

    expect(modalCount(renderer)).toBe(0);

    act(() => {
      renderer.root.findByProps({ testID: 'host-control' }).props.onPress();
    });
    expect(hostPress).toHaveBeenCalledOnce();
  });

  it('keeps launcher, settings, and explorer Modals mutually exclusive', async () => {
    const renderer = await renderHost();
    const openFab = () => {
      renderer.root
        .findByProps({ accessibilityLabel: 'Open Database DevTools' })
        .props.onPress();
    };

    act(openFab);
    act(() => {
      renderer.root
        .findByProps({ accessibilityLabel: 'Open DevTools settings' })
        .props.onPress();
    });

    expect(modalCount(renderer)).toBe(1);
    expect(
      renderer.root.findByProps({ accessibilityLabel: 'Close settings' }),
    ).toBeDefined();

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Close settings' }).props.onPress();
      openFab();
    });
    await act(async () => {
      renderer.root
        .findByProps({ accessibilityLabel: 'View database on device' })
        .props.onPress();
      await Promise.resolve();
    });

    expect(modalCount(renderer)).toBe(1);
    expect(
      renderer.root.findByProps({ accessibilityLabel: 'Close database explorer' }),
    ).toBeDefined();

    act(() => {
      renderer.root
        .findByProps({ accessibilityLabel: 'Close database explorer' })
        .props.onPress();
    });
    expect(modalCount(renderer)).toBe(0);
  });
});
