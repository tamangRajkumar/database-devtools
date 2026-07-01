import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import type { ConnectionState } from '../client/createDevToolsClient';
import type { DatabaseAdapter } from '../types/adapter';
import type { DatabaseKind } from '../types/kind';
import { isDevToolsEnabled } from '../utils/isDevToolsEnabled';
import { DevToolsProvider } from './DevToolsProvider';
import { DevToolsSettingsModal } from './DevToolsSettingsModal';
import { FloatingDevToolsButton } from './FloatingDevToolsButton';

export type { ConnectionState };

export type DatabaseDevToolsProps = {
  /** Raw database instance (auto-detected) or a resolved adapter. */
  database?: unknown;
  /** Explicit database kind override. */
  type?: DatabaseKind;
  /** Custom adapter override (advanced). */
  adapter?: DatabaseAdapter;
  serverUrl?: string;
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left';
  /** Optional style for the floating button database icon. */
  style?: StyleProp<TextStyle>;
  onConnectionStateChange?: (state: ConnectionState) => void;
};

export function DatabaseDevTools({
  database,
  type,
  adapter,
  serverUrl,
  enabled,
  position = 'bottom-right',
  style,
  onConnectionStateChange,
}: DatabaseDevToolsProps) {
  if (!isDevToolsEnabled(enabled)) {
    return null;
  }

  return (
    <DevToolsProvider
      adapter={adapter}
      database={database}
      onConnectionStateChange={onConnectionStateChange}
      serverUrl={serverUrl}
      type={type}
    >
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <FloatingDevToolsButton iconStyle={style} position={position} />
        <DevToolsSettingsModal />
      </View>
    </DevToolsProvider>
  );
}
