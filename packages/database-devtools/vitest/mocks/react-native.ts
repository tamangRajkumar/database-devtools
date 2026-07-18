export const Platform = { OS: 'ios' as const };

export const NativeModules = {
  RNCAsyncStorage: {},
  RNC_AsyncSQLiteDBStoragePassThru: {},
  PlatformLocalStorage: {},
};

function flattenStyle(style: unknown): unknown {
  if (!Array.isArray(style)) {
    return style ?? {};
  }

  return Object.assign({}, ...style.filter(Boolean).map(flattenStyle));
}

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T) => styles,
  flatten: flattenStyle,
  absoluteFill: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  absoluteFillObject: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
};

export const View = 'View';
export const Text = 'Text';
export const Modal = 'Modal';
export const Pressable = 'Pressable';
export const ScrollView = 'ScrollView';
export const TextInput = 'TextInput';
export const ActivityIndicator = 'ActivityIndicator';
export const FlatList = 'FlatList';

export const useWindowDimensions = () => ({ width: 390, height: 844 });

export const PanResponder = {
  create: (handlers: Record<string, unknown>) => ({ panHandlers: handlers }),
};
