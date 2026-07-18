import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useDevTools } from '../hooks/useDevTools';
import {
  FLOATING_BUTTON_MARGIN,
  FLOATING_BUTTON_SIZE,
  clampFloatingPosition,
  getCornerPosition,
  getDefaultFloatingButtonBottomInset,
  isFloatingButtonTap,
  snapFloatingPositionToEdges,
  type FloatingButtonCorner,
  type FloatingButtonPosition,
} from '../utils/floatingButtonPosition';
import { getConnectionDotColor } from './ConnectionStatusBadge';

const DEFAULT_ICON_SIZE = 22;
const DEFAULT_ICON_COLOR = '#f8fafc';
const DEFAULT_BUTTON_COLOR = '#1e293b';
const FIXED_BOTTOM_INSET = getDefaultFloatingButtonBottomInset();

export type FloatingDevToolsButtonProps = {
  position?: FloatingButtonCorner;
  iconStyle?: StyleProp<TextStyle>;
  /** Floating button background color. */
  buttonColor?: string;
  /** Database icon color. */
  iconColor?: string;
  draggable?: boolean;
  snapToEdges?: boolean;
  floatingPosition?: FloatingButtonPosition;
  onFloatingPositionChange?: (position: FloatingButtonPosition) => void;
};

export function FloatingDevToolsButton({
  position = 'bottom-right',
  iconStyle,
  buttonColor,
  iconColor,
  draggable = true,
  snapToEdges = true,
  floatingPosition,
  onFloatingPositionChange,
}: FloatingDevToolsButtonProps) {
  const { connectionState, openLauncher } = useDevTools();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [internalPosition, setInternalPosition] = useState<FloatingButtonPosition | null>(null);
  const [dragPosition, setDragPosition] = useState<FloatingButtonPosition | null>(null);
  const dragOrigin = useRef<FloatingButtonPosition>({ x: 0, y: 0 });
  const hasInitialized = useRef(false);
  const onFloatingPositionChangeRef = useRef(onFloatingPositionChange);

  useEffect(() => {
    onFloatingPositionChangeRef.current = onFloatingPositionChange;
  }, [onFloatingPositionChange]);

  const layout = useMemo(
    () => ({
      windowWidth,
      windowHeight,
      buttonSize: FLOATING_BUTTON_SIZE,
      margin: FLOATING_BUTTON_MARGIN,
    }),
    [windowWidth, windowHeight],
  );

  const committedPosition = floatingPosition ?? internalPosition;
  const renderedPosition = dragPosition ?? committedPosition;

  const commitPosition = useCallback(
    (next: FloatingButtonPosition) => {
      const clamped = clampFloatingPosition(next, layout);

      if (!floatingPosition) {
        setInternalPosition(clamped);
      }

      onFloatingPositionChangeRef.current?.(clamped);
      return clamped;
    },
    [floatingPosition, layout],
  );

  useEffect(() => {
    if (windowWidth <= 0 || windowHeight <= 0) {
      return;
    }

    if (floatingPosition) {
      hasInitialized.current = true;
      return;
    }

    if (!hasInitialized.current) {
      setInternalPosition(getCornerPosition(position, layout));
      hasInitialized.current = true;
    }
  }, [floatingPosition, layout, position, windowHeight, windowWidth]);

  useEffect(() => {
    if (!committedPosition || windowWidth <= 0 || windowHeight <= 0) {
      return;
    }

    const clamped = clampFloatingPosition(committedPosition, layout);

    if (clamped.x !== committedPosition.x || clamped.y !== committedPosition.y) {
      commitPosition(clamped);
    }
  }, [commitPosition, committedPosition, layout, windowHeight, windowWidth]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => draggable,
        onMoveShouldSetPanResponder: (_, gesture) =>
          draggable && (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
        onPanResponderGrant: () => {
          if (!committedPosition) {
            return;
          }

          dragOrigin.current = committedPosition;
        },
        onPanResponderMove: (_, gesture) => {
          setDragPosition(
            clampFloatingPosition(
              {
                x: dragOrigin.current.x + gesture.dx,
                y: dragOrigin.current.y + gesture.dy,
              },
              layout,
            ),
          );
        },
        onPanResponderRelease: (_, gesture) => {
          setDragPosition(null);

          const movement = Math.hypot(gesture.dx, gesture.dy);

          if (isFloatingButtonTap(movement)) {
            openLauncher();
            return;
          }

          const raw = {
            x: dragOrigin.current.x + gesture.dx,
            y: dragOrigin.current.y + gesture.dy,
          };
          const next = snapToEdges
            ? snapFloatingPositionToEdges(raw, layout)
            : clampFloatingPosition(raw, layout);

          commitPosition(next);
        },
        onPanResponderTerminate: () => {
          setDragPosition(null);
        },
      }),
    [commitPosition, committedPosition, draggable, layout, openLauncher, snapToEdges],
  );

  if (!renderedPosition) {
    return null;
  }

  const resolvedButtonColor = buttonColor ?? DEFAULT_BUTTON_COLOR;
  const resolvedIconColor =
    iconColor ?? StyleSheet.flatten(iconStyle)?.color ?? DEFAULT_ICON_COLOR;
  const buttonStyle = { backgroundColor: resolvedButtonColor };
  const statusDotStyle = {
    backgroundColor: getConnectionDotColor(connectionState),
    borderColor: resolvedButtonColor,
  };

  const buttonContent = (
    <>
      <MaterialCommunityIcons
        color={resolvedIconColor}
        name="database"
        size={DEFAULT_ICON_SIZE}
        style={iconStyle}
      />
      <View style={[styles.statusDot, statusDotStyle]} />
    </>
  );

  if (!draggable) {
    const positionStyle = position === 'bottom-left' ? styles.bottomLeft : styles.bottomRight;

    return (
      <View style={[styles.fixedContainer, positionStyle]} pointerEvents="box-none">
        <Pressable
          accessibilityLabel="Open Database DevTools"
          accessibilityRole="button"
          onPress={openLauncher}
          style={({ pressed }) => [
            styles.button,
            buttonStyle,
            pressed && styles.buttonPressed,
          ]}
        >
          {buttonContent}
        </Pressable>
      </View>
    );
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.draggableContainer,
        {
          transform: [
            { translateX: renderedPosition.x },
            { translateY: renderedPosition.y },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View
        accessibilityHint="Drag to move. Tap to open DevTools launcher."
        accessibilityLabel="Open Database DevTools"
        accessibilityRole="button"
        style={[styles.button, buttonStyle, dragPosition && styles.buttonDragging]}
      >
        {buttonContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fixedContainer: {
    position: 'absolute',
    bottom: FIXED_BOTTOM_INSET,
    zIndex: 9999,
    elevation: 24,
  },
  bottomRight: {
    right: 16,
  },
  bottomLeft: {
    left: 16,
  },
  draggableContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
    elevation: 24,
  },
  button: {
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 24,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDragging: {
    opacity: 0.92,
    transform: [{ scale: 1.04 }],
  },
  statusDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
});
