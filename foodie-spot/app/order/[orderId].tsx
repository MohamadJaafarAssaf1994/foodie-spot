import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { useOrderDetails } from '@/hooks/use-order-details';
import type { Order } from '@/types';

const getStatusTranslationKey = (status: Order['status']) => {
  switch (status) {
    case 'pending':
      return 'orders_status_pending';
    case 'confirmed':
      return 'orders_status_confirmed';
    case 'preparing':
      return 'orders_status_preparing';
    case 'on-the-way':
      return 'orders_status_on_the_way';
    case 'delivered':
      return 'orders_status_delivered';
    case 'cancelled':
      return 'orders_status_cancelled';
  }
};

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useI18n();
  const { order, loading, error } = useOrderDetails(orderId);

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState message={t('orders_loading')} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.content}>
          <Text style={styles.title}>{t('orders_detail_title')}</Text>
          <ErrorState message={error || t('orders_not_found')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('orders_detail_title')}</Text>
        <Text style={styles.subtitle}>{t('orders_detail_subtitle', { id: order.id })}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>{t('orders_detail_restaurant')}</Text>
          <Text style={styles.value}>{order.restaurantName}</Text>

          <Text style={styles.label}>{t('orders_detail_status')}</Text>
          <Text style={styles.value}>{t(getStatusTranslationKey(order.status))}</Text>

          <Text style={styles.label}>{t('orders_detail_delivery_address')}</Text>
          <Text style={styles.value}>{order.deliveryAddress}</Text>

          <Text style={styles.label}>{t('orders_detail_total')}</Text>
          <Text style={styles.value}>{order.total} €</Text>

          <Text style={styles.label}>{t('orders_detail_delivery_fee')}</Text>
          <Text style={styles.value}>{order.deliveryFee} €</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('orders_detail_items')}</Text>
          {order.items.map((item, index) => (
            <View key={`${item.dish.id}-${index}`} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.quantity} x {item.dish.name}</Text>
              <Text style={styles.itemPrice}>{item.dish.price} €</Text>
            </View>
          ))}
        </View>

        {order.status === 'delivered' ? (
          <TouchableOpacity style={styles.reviewButton} onPress={() => router.push(`/review/${order.id}`)}>
            <Text style={styles.reviewButtonText}>{t('orders_detail_leave_review')}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    color: Colors.light.textMuted,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  label: {
    fontSize: 12,
    color: Colors.light.textSubtle,
    marginTop: Spacing.sm,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
  },
  itemName: {
    flex: 1,
    color: Colors.light.text,
  },
  itemPrice: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
  reviewButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
