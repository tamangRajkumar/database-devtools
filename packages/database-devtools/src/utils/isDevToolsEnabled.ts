export function isDevToolsEnabled(enabled?: boolean): boolean {
  if (enabled === false) {
    return false;
  }

  if (enabled === true) {
    return true;
  }

  return typeof __DEV__ !== 'undefined' && __DEV__;
}
