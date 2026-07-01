import { StyleSheet, Text, View } from 'react-native';
import type { ConnectionState } from '../client/createDevToolsClient';

export type ConnectionStatusBadgeProps = {
  state: ConnectionState;
};

type StatusConfig = {
  label: string;
  color: string;
  backgroundColor: string;
};

function getStatusConfig(state: ConnectionState): StatusConfig {
  switch (state) {
    case 'connected':
      return { label: 'Connected', color: '#166534', backgroundColor: '#dcfce7' };
    case 'reconnecting':
      return { label: 'Reconnecting', color: '#92400e', backgroundColor: '#fef3c7' };
    case 'connecting':
      return { label: 'Connecting', color: '#92400e', backgroundColor: '#fef3c7' };
    case 'disconnected':
      return { label: 'Disconnected', color: '#991b1b', backgroundColor: '#fee2e2' };
  }
}

export function getConnectionDotColor(state: ConnectionState): string {
  switch (state) {
    case 'connected':
      return '#22c55e';
    case 'reconnecting':
    case 'connecting':
      return '#eab308';
    case 'disconnected':
      return '#ef4444';
  }
}

export function ConnectionStatusBadge({ state }: ConnectionStatusBadgeProps) {
  const config = getStatusConfig(state);

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <View style={[styles.dot, { backgroundColor: getConnectionDotColor(state) }]} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
