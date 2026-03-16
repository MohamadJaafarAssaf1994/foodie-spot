import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

interface LoadingStateProps {
  message?: string;
  color?: string;
}

export function LoadingState({
  message = 'Chargement...',
  color,
}: LoadingStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={color || colors.primary} />
      <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
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
