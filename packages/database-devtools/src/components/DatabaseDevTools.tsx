import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import type { ConnectionState } from '../client/createDevToolsClient';
import type { DatabaseAdapter } from '../types/adapter';
import type { DatabaseKind } from '../types/kind';
import type { FloatingButtonPosition } from '../utils/floatingButtonPosition';
import { isDevToolsEnabled } from '../utils/isDevToolsEnabled';
import { DevToolsProvider } from './DevToolsProvider';
import { DevToolsLauncherModal } from './DevToolsLauncherModal';
import { DevToolsSettingsModal } from './DevToolsSettingsModal';
import { FloatingDevToolsButton } from './FloatingDevToolsButton';
import { MobileDatabaseExplorer } from './mobile/MobileDatabaseExplorer';

export type { ConnectionState };
export type { FloatingButtonPosition };

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
  /** Allow dragging the floating button around the screen. */
  draggable?: boolean;
  /** Snap the button to screen edges after dragging. */
  snapToEdges?: boolean;
  /** Controlled floating button position. */
  floatingPosition?: FloatingButtonPosition;
  /** Called when the user drags the floating button to a new position. */
  onFloatingPositionChange?: (position: FloatingButtonPosition) => void;
  /** Optional style for the floating button database icon. */
  style?: StyleProp<TextStyle>;
  /** Floating button background color. */
  buttonColor?: string;
  /** Database icon color. */
  iconColor?: string;
  onConnectionStateChange?: (state: ConnectionState) => void;
};

export function DatabaseDevTools({
  database,
  type,
  adapter,
  serverUrl,
  enabled,
  position = 'bottom-right',
  draggable = true,
  snapToEdges = true,
  floatingPosition,
  onFloatingPositionChange,
  style,
  buttonColor,
  iconColor,
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
      <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, styles.overlay]}>
        <FloatingDevToolsButton
          buttonColor={buttonColor}
          draggable={draggable}
          floatingPosition={floatingPosition}
          iconColor={iconColor}
          iconStyle={style}
          onFloatingPositionChange={onFloatingPositionChange}
          position={position}
          snapToEdges={snapToEdges}
        />
      </View>
      <DevToolsLauncherModal />
      <DevToolsSettingsModal />
      <MobileDatabaseExplorer />
    </DevToolsProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 99999,
    elevation: 24,
  },
});
