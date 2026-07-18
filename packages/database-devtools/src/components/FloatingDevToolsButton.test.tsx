import { createElement } from 'react';
import {
  act,
  create,
  type ReactTestInstance,
  type ReactTestRenderer,
} from 'react-test-renderer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDevTools } from '../hooks/useDevTools';
import { FLOATING_BUTTON_SIZE } from '../utils/floatingButtonPosition';
import { FloatingDevToolsButton } from './FloatingDevToolsButton';

vi.mock('../hooks/useDevTools', () => ({
  useDevTools: vi.fn(),
}));

const openLauncher = vi.fn();

function flattenStyle(style: unknown): Record<string, unknown> {
  if (!Array.isArray(style)) {
    return (style ?? {}) as Record<string, unknown>;
  }

  return Object.assign({}, ...style.filter(Boolean).map(flattenStyle));
}

async function renderButton(
  props: Parameters<typeof FloatingDevToolsButton>[0] = {},
): Promise<ReactTestRenderer> {
  let renderer!: ReactTestRenderer;

  await act(async () => {
    renderer = create(createElement(FloatingDevToolsButton, props));
  });

  return renderer;
}

function findButton(root: ReactTestInstance): ReactTestInstance {
  return root.findByProps({ accessibilityLabel: 'Open Database DevTools' });
}

beforeEach(() => {
  openLauncher.mockReset();
  vi.mocked(useDevTools).mockReturnValue({
    connectionState: 'connected',
    openLauncher,
  } as unknown as ReturnType<typeof useDevTools>);
});

describe('FloatingDevToolsButton', () => {
  it.each([
    ['bottom-left', 'left'],
    ['bottom-right', 'right'],
  ] as const)('keeps the fixed %s hitbox to the visible button', async (position, edge) => {
    const renderer = await renderButton({ draggable: false, position });
    const button = findButton(renderer.root);
    const containerStyle = flattenStyle(button.parent?.props.style);

    expect(containerStyle).toMatchObject({
      position: 'absolute',
      width: FLOATING_BUTTON_SIZE,
      height: FLOATING_BUTTON_SIZE,
      [edge]: 16,
    });

    act(() => {
      button.props.onPress();
    });

    expect(openLauncher).toHaveBeenCalledOnce();
  });

  it('preserves custom colors and accessibility in fixed mode', async () => {
    const renderer = await renderButton({
      buttonColor: '#123456',
      draggable: false,
      iconColor: '#abcdef',
    });
    const button = findButton(renderer.root);
    const renderedButtonStyle = flattenStyle(button.props.style({ pressed: false }));
    const icon = renderer.root.find(
      (node) => String(node.type) === 'MaterialCommunityIcons',
    );

    expect(button.props.accessibilityRole).toBe('button');
    expect(renderedButtonStyle.backgroundColor).toBe('#123456');
    expect(icon.props.color).toBe('#abcdef');
    expect(icon.props.name).toBe('database');
  });

  it('opens the launcher for a simple draggable tap', async () => {
    const renderer = await renderButton({
      floatingPosition: { x: 100, y: 200 },
    });
    const button = findButton(renderer.root);
    const containerStyle = flattenStyle(button.parent?.props.style);

    expect(containerStyle).toMatchObject({
      width: FLOATING_BUTTON_SIZE,
      height: FLOATING_BUTTON_SIZE,
      transform: [{ translateX: 100 }, { translateY: 200 }],
    });
    expect(button.props.accessibilityHint).toContain('Drag to move');

    act(() => {
      button.props.onPanResponderGrant();
      button.props.onPanResponderRelease({}, { dx: 0, dy: 0 });
    });

    expect(openLauncher).toHaveBeenCalledOnce();
  });

  it('handles drag and edge snapping only on the button hitbox', async () => {
    const onFloatingPositionChange = vi.fn();
    const renderer = await renderButton({
      floatingPosition: { x: 100, y: 200 },
      onFloatingPositionChange,
      snapToEdges: true,
    });
    const button = findButton(renderer.root);

    expect(button.props.onStartShouldSetPanResponder()).toBe(true);

    act(() => {
      button.props.onPanResponderGrant();
      button.props.onPanResponderMove({}, { dx: 300, dy: 500 });
      button.props.onPanResponderRelease({}, { dx: 300, dy: 500 });
    });

    expect(openLauncher).not.toHaveBeenCalled();
    expect(onFloatingPositionChange).toHaveBeenCalledWith({ x: 326, y: 780 });
  });

  it('initializes and updates an uncontrolled draggable position', async () => {
    const onFloatingPositionChange = vi.fn();
    const renderer = await renderButton({ onFloatingPositionChange });
    const button = findButton(renderer.root);
    const initialStyle = flattenStyle(button.parent?.props.style);

    expect(initialStyle.transform).toEqual([{ translateX: 326 }, { translateY: 772 }]);

    act(() => {
      button.props.onPanResponderGrant();
      button.props.onPanResponderRelease({}, { dx: -300, dy: 0 });
    });

    expect(onFloatingPositionChange).toHaveBeenCalledWith({ x: 16, y: 780 });
  });
});
