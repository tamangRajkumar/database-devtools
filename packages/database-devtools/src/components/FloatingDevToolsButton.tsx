import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import { useDevTools } from '../hooks/useDevTools';
import { getConnectionDotColor } from './ConnectionStatusBadge';

const DEFAULT_ICON_SIZE = 22;
const DEFAULT_ICON_COLOR = '#f8fafc';

export type FloatingDevToolsButtonProps = {
  position?: 'bottom-right' | 'bottom-left';
  iconStyle?: StyleProp<TextStyle>;
};

export function FloatingDevToolsButton({
  position = 'bottom-right',
  iconStyle,
}: FloatingDevToolsButtonProps) {
  const { connectionState, openSettings } = useDevTools();

  const positionStyle =
    position === 'bottom-left' ? styles.bottomLeft : styles.bottomRight;

  return (
    <View style={[styles.container, positionStyle]} pointerEvents="box-none">
      <Pressable
        accessibilityLabel="Open Database DevTools"
        accessibilityRole="button"
        onPress={openSettings}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <MaterialCommunityIcons
          color={DEFAULT_ICON_COLOR}
          name="database"
          size={DEFAULT_ICON_SIZE}
          style={iconStyle}
        />
        <View
          style={[styles.statusDot, { backgroundColor: getConnectionDotColor(connectionState) }]}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    zIndex: 9999,
  },
  bottomRight: {
    right: 16,
  },
  bottomLeft: {
    left: 16,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  statusDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#1e293b',
  },
});
