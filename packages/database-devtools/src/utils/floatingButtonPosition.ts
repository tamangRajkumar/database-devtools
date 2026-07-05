export type FloatingButtonCorner = 'bottom-right' | 'bottom-left';

export type FloatingButtonPosition = {
  x: number;
  y: number;
};

export type FloatingButtonLayout = {
  windowWidth: number;
  windowHeight: number;
  buttonSize: number;
  margin: number;
};

export const FLOATING_BUTTON_SIZE = 48;
export const FLOATING_BUTTON_MARGIN = 16;
export const FLOATING_BUTTON_BOTTOM = 24;
export const FLOATING_BUTTON_TAP_THRESHOLD = 8;

export function getCornerPosition(
  corner: FloatingButtonCorner,
  layout: FloatingButtonLayout,
  bottomInset = FLOATING_BUTTON_BOTTOM,
): FloatingButtonPosition {
  const { windowWidth, windowHeight, buttonSize, margin } = layout;
  const y = windowHeight - bottomInset - buttonSize;

  return {
    x: corner === 'bottom-right' ? windowWidth - margin - buttonSize : margin,
    y,
  };
}

export function clampFloatingPosition(
  position: FloatingButtonPosition,
  layout: FloatingButtonLayout,
): FloatingButtonPosition {
  const { windowWidth, windowHeight, buttonSize, margin } = layout;

  return {
    x: Math.min(Math.max(margin, position.x), windowWidth - margin - buttonSize),
    y: Math.min(Math.max(margin, position.y), windowHeight - margin - buttonSize),
  };
}

export function snapFloatingPositionToEdges(
  position: FloatingButtonPosition,
  layout: FloatingButtonLayout,
): FloatingButtonPosition {
  const { windowWidth, windowHeight, buttonSize, margin } = layout;
  const clamped = clampFloatingPosition(position, layout);
  const centerX = clamped.x + buttonSize / 2;
  const centerY = clamped.y + buttonSize / 2;

  let x = centerX < windowWidth / 2 ? margin : windowWidth - margin - buttonSize;
  let y = clamped.y;

  if (centerY < windowHeight * 0.2) {
    y = margin;
  } else if (centerY > windowHeight * 0.8) {
    y = windowHeight - margin - buttonSize;
  }

  return { x, y };
}

export function isFloatingButtonTap(totalMovement: number): boolean {
  return totalMovement < FLOATING_BUTTON_TAP_THRESHOLD;
}
