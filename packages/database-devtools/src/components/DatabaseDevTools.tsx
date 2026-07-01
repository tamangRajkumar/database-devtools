import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import type { ConnectionState } from '../client/createDevToolsClient';
import type { DatabaseAdapter } from '../types/adapter';
import { isDevToolsEnabled } from '../utils/isDevToolsEnabled';
import { DevToolsProvider } from './DevToolsProvider';
import { DevToolsSettingsModal } from './DevToolsSettingsModal';
import { FloatingDevToolsButton } from './FloatingDevToolsButton';

export type { ConnectionState };

export type DatabaseDevToolsProps = {
  database?: DatabaseAdapter;
  serverUrl?: string;
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left';
  /** Optional style for the floating button database icon. */
  style?: StyleProp<TextStyle>;
  onConnectionStateChange?: (state: ConnectionState) => void;
};

export function DatabaseDevTools({
  database,
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
      database={database}
      onConnectionStateChange={onConnectionStateChange}
      serverUrl={serverUrl}
    >
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <FloatingDevToolsButton iconStyle={style} position={position} />
        <DevToolsSettingsModal />
      </View>
    </DevToolsProvider>
  );
}
