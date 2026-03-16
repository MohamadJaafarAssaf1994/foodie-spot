import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

interface EmptyStateProps {
  title: string;
  icon?: string;
  illustration?: React.ReactNode;
}

export function EmptyState({ title, icon, illustration }: EmptyStateProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      {illustration ? <View style={styles.illustration}>{illustration}</View> : null}
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.title, { color: colors.textSubtle }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  illustration: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default EmptyState;
