import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

interface LoadingStateProps {
  message?: string;
  color?: string;
}

export function LoadingState({
  message = 'Chargement...',
  color = Colors.light.primary,
}: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  message: {
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
});

export default LoadingState;
