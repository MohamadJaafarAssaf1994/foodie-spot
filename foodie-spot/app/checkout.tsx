import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { useToast } from '@/components/toast-provider';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { cart } from '@/services/cart';
import { cartAPI, orderAPI, promoAPI } from '@/services/api';
import { getApiErrorMessage } from '@/services/api-utils';
import type { CartItem, CartValidationResult, PromoValidationResult } from '@/types';

type PaymentMethod = 'card' | 'cash';

export default function CheckoutScreen() {
  const { t } = useI18n();
  const toast = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [validation, setValidation] = useState<CartValidationResult | null>(null);
  const [promo, setPromo] = useState<PromoValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const restaurantId = items[0]?.dish.restaurantId;
  const hasMixedRestaurants = useMemo(() => new Set(items.map(item => item.dish.restaurantId)).size > 1, [items]);
  const localTotals = useMemo(() => cart.getTotals(items), [items]);
  const debouncedPromoCode = useDebouncedValue(promoCode.trim(), 450);

  const validateCurrentCart = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const nextItems = await cart.getCart();
      setItems(nextItems);
      const mixedRestaurants = new Set(nextItems.map(item => item.dish.restaurantId)).size > 1;

      if (nextItems.length === 0 || mixedRestaurants || !nextItems[0]?.dish.restaurantId) {
        setValidation(null);
        return;
      }

      const result = await cartAPI.validateCart({
        restaurantId: nextItems[0].dish.restaurantId,
        items: nextItems.map(item => ({ menuItemId: item.dish.id, quantity: item.quantity })),
      });
      setValidation(result);
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : t('checkout_validation_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void validateCurrentCart();
  }, [validateCurrentCart]);

  const applyPromo = useCallback(async (rawCode?: string) => {
    const code = (rawCode ?? promoCode).trim().toUpperCase();

    if (!restaurantId || !validation || !code) {
      setPromo(null);
      setPromoMessage(null);
      setPromoError(null);
      return;
    }

    try {
      setPromoLoading(true);
      setPromoError(null);
      setPromoMessage(t('checkout_promo_validating'));
      const result = await promoAPI.validatePromo({
        code,
        subtotal: validation.subtotal,
        restaurantId,
      });
      setPromo(result);
      setPromoMessage(result.discountDisplay || result.description || t('checkout_promo_success'));
    } catch (promoValidationError) {
      setPromo(null);
      setPromoError(getApiErrorMessage(promoValidationError, t('checkout_promo_error')));
      setPromoMessage(null);
    } finally {
      setPromoLoading(false);
    }
  }, [promoCode, restaurantId, t, validation]);

  useEffect(() => {
    if (!debouncedPromoCode) {
      setPromo(null);
      setPromoMessage(null);
      setPromoError(null);
      setPromoLoading(false);
      return;
    }

    if (!restaurantId || !validation) {
      return;
    }

    void applyPromo(debouncedPromoCode);
  }, [applyPromo, debouncedPromoCode, restaurantId, validation]);

  const handleConfirmOrder = async () => {
    if (!restaurantId || !validation) {
      return;
    }

    try {
      setSubmitting(true);
      const order = await orderAPI.createOrder({
        restaurantId,
        items: items.map(item => ({ menuItemId: item.dish.id, quantity: item.quantity })),
        deliveryAddress: address.trim(),
        paymentMethod,
        promoCode: promoCode.trim() || undefined,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
      });
      await cart.clear();
      toast.success(t('checkout_success'));
      router.replace(`/tracking/${order.id}`);
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : t('checkout_validation_error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState message={t('checkout_title')} />
      </SafeAreaView>
    );
  }

  if (items.length === 0 || hasMixedRestaurants) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState message={items.length === 0 ? t('cart_empty') : t('cart_mixed_restaurants')} onAction={() => router.replace('/cart')} />
      </SafeAreaView>
    );
  }

  const subtotal = validation?.subtotal ?? localTotals.subtotal;
  const deliveryFee = validation?.deliveryFee ?? 0;
  const serviceFee = validation?.serviceFee ?? 0;
  const promoDiscount = promo?.type === 'delivery' ? deliveryFee : (promo?.discountAmount || 0);
  const total = (validation ? validation.total : subtotal + deliveryFee + serviceFee) - promoDiscount;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('checkout_title')}</Text>
        {error ? <ErrorState message={error} onAction={validateCurrentCart} /> : null}

        <Text style={styles.label}>{t('checkout_address')}</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder={t('checkout_address_placeholder')} />

        <Text style={styles.label}>{t('checkout_delivery_instructions')}</Text>
        <TextInput style={[styles.input, styles.multiline]} value={deliveryInstructions} onChangeText={setDeliveryInstructions} multiline />

        <Text style={styles.label}>{t('checkout_payment')}</Text>
        <View style={styles.paymentRow}>
          {(['card', 'cash'] as PaymentMethod[]).map(method => (
            <TouchableOpacity
              key={method}
              style={[styles.paymentChip, paymentMethod === method && styles.paymentChipActive]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text style={[styles.paymentChipText, paymentMethod === method && styles.paymentChipTextActive]}>
                {method === 'card' ? t('checkout_card') : t('checkout_cash')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('checkout_promo')}</Text>
        <View style={styles.promoRow}>
          <TextInput
            style={[styles.input, styles.promoInput]}
            value={promoCode}
            onChangeText={value => setPromoCode(value.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder={t('checkout_promo_placeholder')}
          />
          <TouchableOpacity style={[styles.promoButton, promoLoading && styles.promoButtonDisabled]} onPress={() => void applyPromo()} disabled={promoLoading}>
            {promoLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.promoButtonText}>{t('checkout_apply_promo')}</Text>}
          </TouchableOpacity>
        </View>
        {promoMessage ? <Text style={styles.promoSuccess}>{promoMessage}</Text> : null}
        {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}

        <View style={styles.summary}>
          <View style={styles.row}><Text>{t('cart_subtotal')}</Text><Text>{subtotal.toFixed(2)} €</Text></View>
          <View style={styles.row}><Text>{t('cart_delivery')}</Text><Text>{deliveryFee.toFixed(2)} €</Text></View>
          <View style={styles.row}><Text>{t('cart_service_fee')}</Text><Text>{serviceFee.toFixed(2)} €</Text></View>
          {promo ? (
            <View style={styles.row}>
              <Text>{t('checkout_promo')}</Text>
              <Text>
                {promo.type === 'delivery'
                  ? t('checkout_free_delivery')
                  : `-${promoDiscount.toFixed(2)} €`}
              </Text>
            </View>
          ) : null}
          <View style={styles.row}><Text style={styles.totalLabel}>{t('checkout_total')}</Text><Text style={styles.totalValue}>{total.toFixed(2)} €</Text></View>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, (!address.trim() || submitting) && styles.confirmButtonDisabled]}
          disabled={!address.trim() || submitting}
          onPress={handleConfirmOrder}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>{t('checkout_confirm')}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: Spacing.lg, gap: Spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: Colors.light.text },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
  paymentRow: { flexDirection: 'row', gap: Spacing.sm },
  paymentChip: { flex: 1, padding: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.light.surfaceMuted, alignItems: 'center' },
  paymentChipActive: { backgroundColor: Colors.light.primary },
  paymentChipText: { color: Colors.light.textMuted, fontWeight: '600' },
  paymentChipTextActive: { color: '#fff' },
  promoRow: { flexDirection: 'row', gap: Spacing.sm },
  promoInput: { flex: 1 },
  promoButton: { backgroundColor: Colors.light.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, justifyContent: 'center' },
  promoButtonDisabled: { opacity: 0.7 },
  promoButtonText: { color: '#fff', fontWeight: '700' },
  promoSuccess: { color: Colors.light.success, fontSize: 13, fontWeight: '600' },
  promoError: { color: Colors.light.error, fontSize: 13, fontWeight: '600' },
  summary: { backgroundColor: Colors.light.surface, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontWeight: '700', color: Colors.light.text },
  totalValue: { fontWeight: '700', color: Colors.light.primary },
  confirmButton: { backgroundColor: Colors.light.primary, borderRadius: Radius.md, padding: Spacing.lg, alignItems: 'center' },
  confirmButtonDisabled: { opacity: 0.6 },
  confirmButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
