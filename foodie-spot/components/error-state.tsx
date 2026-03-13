import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

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
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onAction ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
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
    color: Colors.light.error,
    textAlign: 'center',
  },
  action: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
});

export default ErrorState;
