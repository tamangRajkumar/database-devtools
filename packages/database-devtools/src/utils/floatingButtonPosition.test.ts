import { describe, expect, it } from 'vitest';
import {
  FLOATING_BUTTON_BOTTOM,
  FLOATING_BUTTON_BOTTOM_ANDROID,
  clampFloatingPosition,
  getCornerPosition,
  getDefaultFloatingButtonBottomInset,
  isFloatingButtonTap,
  snapFloatingPositionToEdges,
} from './floatingButtonPosition';

const layout = {
  windowWidth: 400,
  windowHeight: 800,
  buttonSize: 48,
  margin: 16,
};

describe('getDefaultFloatingButtonBottomInset', () => {
  it('uses a taller inset on Android', () => {
    expect(getDefaultFloatingButtonBottomInset('android')).toBe(FLOATING_BUTTON_BOTTOM_ANDROID);
  });

  it('uses the default inset on iOS', () => {
    expect(getDefaultFloatingButtonBottomInset('ios')).toBe(FLOATING_BUTTON_BOTTOM);
  });
});

describe('getCornerPosition', () => {
  it('places bottom-right corner', () => {
    expect(getCornerPosition('bottom-right', layout)).toEqual({ x: 336, y: 728 });
  });

  it('places bottom-left corner', () => {
    expect(getCornerPosition('bottom-left', layout)).toEqual({ x: 16, y: 728 });
  });

  it('honors an explicit Android-style bottom inset', () => {
    expect(getCornerPosition('bottom-right', layout, FLOATING_BUTTON_BOTTOM_ANDROID)).toEqual({
      x: 336,
      y: 704,
    });
  });
});

describe('clampFloatingPosition', () => {
  it('keeps position inside bounds', () => {
    expect(clampFloatingPosition({ x: -20, y: 900 }, layout)).toEqual({ x: 16, y: 736 });
  });
});

describe('snapFloatingPositionToEdges', () => {
  it('snaps to right edge when dragged to the right half', () => {
    expect(snapFloatingPositionToEdges({ x: 250, y: 400 }, layout)).toEqual({ x: 336, y: 400 });
  });

  it('snaps to left edge when dragged to the left half', () => {
    expect(snapFloatingPositionToEdges({ x: 120, y: 400 }, layout)).toEqual({ x: 16, y: 400 });
  });

  it('snaps to top when near the top edge', () => {
    expect(snapFloatingPositionToEdges({ x: 120, y: 40 }, layout)).toEqual({ x: 16, y: 16 });
  });
});

describe('isFloatingButtonTap', () => {
  it('treats small movement as tap', () => {
    expect(isFloatingButtonTap(3)).toBe(true);
    expect(isFloatingButtonTap(12)).toBe(false);
  });
});
