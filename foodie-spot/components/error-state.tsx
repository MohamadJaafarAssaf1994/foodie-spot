import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

interface ErrorStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorState({
  message,
  actionLabel = 'Réessayer',
  onAction,
}: ErrorStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.message, { color: colors.error }]}>{message}</Text>
      {onAction ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={[styles.action, { color: colors.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
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
    textAlign: 'center',
  },
  action: {
    fontWeight: '700',
  },
});

export default ErrorState;
