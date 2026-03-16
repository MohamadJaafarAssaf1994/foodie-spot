import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { cart } from '@/services/cart';
import type { CartItem } from '@/types';

export default function CartScreen() {
  const { t } = useI18n();
  const [items, setItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      setError(null);
      const nextItems = await cart.getCart();
      setItems(nextItems);
    } catch {
      setError(t('cart_refresh_error'));
    }
  }, [t]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useFocusEffect(
    useCallback(() => {
      void loadCart();
    }, [loadCart])
  );

  const totals = useMemo(() => cart.getTotals(items), [items]);
  const hasMixedRestaurants = useMemo(
    () => new Set(items.map(item => item.dish.restaurantId)).size > 1,
    [items]
  );

  const updateQuantity = async (dishId: string, quantity: number) => {
    const nextItems = await cart.updateQuantity(dishId, quantity);
    setItems(nextItems);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('cart_title')}</Text>
      </View>

      {error ? <ErrorState message={error} onAction={loadCart} /> : null}

      {items.length === 0 ? (
        <EmptyState title={t('cart_empty')} />
      ) : (
        <View style={styles.content}>
          {items.map(item => (
            <View key={item.dish.id} style={styles.card}>
              <View style={styles.info}>
                <Text style={styles.itemName}>{item.dish.name}</Text>
                <Text style={styles.itemMeta}>{item.dish.price} €</Text>
              </View>
              <View style={styles.controls}>
                <TouchableOpacity style={styles.iconButton} onPress={() => void updateQuantity(item.dish.id, item.quantity - 1)}>
                  {item.quantity === 1 ? <Trash2 size={16} color={Colors.light.error} /> : <Minus size={16} color={Colors.light.text} />}
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity style={styles.iconButton} onPress={() => void updateQuantity(item.dish.id, item.quantity + 1)}>
                  <Plus size={16} color={Colors.light.text} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.summary}>
            <View style={styles.row}>
              <Text style={styles.summaryLabel}>{t('cart_subtotal')}</Text>
              <Text style={styles.summaryValue}>{totals.subtotal.toFixed(2)} €</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.summaryLabel}>{t('cart_total')}</Text>
              <Text style={styles.summaryTotal}>{totals.subtotal.toFixed(2)} €</Text>
            </View>
          </View>

          {hasMixedRestaurants ? (
            <Text style={styles.warning}>{t('cart_mixed_restaurants')}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.checkoutButton, hasMixedRestaurants && styles.checkoutButtonDisabled]}
            disabled={hasMixedRestaurants}
            onPress={() => router.push('/checkout')}
          >
            <Text style={styles.checkoutButtonText}>{t('cart_checkout')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { padding: Spacing.lg },
  title: { fontSize: 24, fontWeight: '700', color: Colors.light.text },
  content: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  info: { flex: 1, gap: 4 },
  itemName: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  itemMeta: { color: Colors.light.textMuted },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceMuted,
  },
  quantity: { minWidth: 16, textAlign: 'center', fontWeight: '700', color: Colors.light.text },
  summary: { backgroundColor: Colors.light.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: Colors.light.textMuted },
  summaryValue: { color: Colors.light.text, fontWeight: '600' },
  summaryTotal: { color: Colors.light.primary, fontWeight: '700' },
  warning: { color: Colors.light.error },
  checkoutButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  checkoutButtonDisabled: { opacity: 0.5 },
  checkoutButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
