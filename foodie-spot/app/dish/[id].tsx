import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, Minus, Plus } from 'lucide-react-native';

import { ErrorState } from '@/components/error-state';
import { AppImages } from '@/constants/assets';
import { localizeDishDescription } from '@/constants/content-translations';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/components/toast-provider';
import { useDishDetails } from '@/hooks/use-dish-details';
import { useI18n } from '@/contexts/i18n-context';

export default function DishScreen() {
  const { id, restaurantId } = useLocalSearchParams<{ id: string; restaurantId?: string }>();
  const toast = useToast();
  const { locale, t } = useI18n();
  const {
    dish,
    quantity,
    loading,
    error,
    addingToCart,
    localizedPrice,
    incrementQuantity,
    decrementQuantity,
    addToCart,
    retryLoadDish,
  } = useDishDetails(id, restaurantId);

  const handleAddToCart = async () => {
    const success = await addToCart();
    if (success) {
      toast.success(t('dish_added_to_cart'));
    } else if (!error) {
      toast.error(t('dish_add_error'));
    }
  };

  if (loading && !dish) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.skeletonScreen}>
          <View style={styles.skeletonHero} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonDescriptionLarge} />
            <View style={styles.skeletonDescriptionSmall} />
            <View style={styles.skeletonRow}>
              <View style={styles.skeletonPrice} />
              <View style={styles.skeletonControls} />
            </View>
            <View style={styles.skeletonButton} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!dish) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState message={error || t('dish_not_found')} onAction={retryLoadDish} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrapper}>
          <Image
            source={dish.image ? { uri: dish.image } : AppImages.imagePlaceholder}
            placeholder={AppImages.imagePlaceholder}
            cachePolicy="memory-disk"
            contentFit="cover"
            transition={180}
            style={styles.image}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {error ? <ErrorState message={error} /> : null}
          <Text style={styles.name}>{dish.name}</Text>
          <Text style={styles.description}>
            {localizeDishDescription(dish.id, dish.description, locale)}
          </Text>

          <View style={styles.quantity}>
            <Text style={styles.price}>{localizedPrice}</Text>
            <View style={styles.qtyControls}>
              <TouchableOpacity
                style={[styles.qtyButton, quantity === 1 && styles.qtyButtonDisabled]}
                onPress={decrementQuantity}
                disabled={quantity === 1}
              >
                <Minus size={18} color={quantity === 1 ? Colors.light.textMuted : '#fff'} />
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyButton} onPress={incrementQuantity}>
                <Plus size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddToCart} disabled={addingToCart}>
            <Text style={styles.addButtonText}>
              {addingToCart ? t('dish_adding_to_cart') : t('dish_add_to_cart')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  skeletonScreen: {
    flex: 1,
  },
  skeletonHero: {
    height: 300,
    backgroundColor: Colors.light.surfaceMuted,
  },
  skeletonContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  skeletonTitle: {
    width: '58%',
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceMuted,
  },
  skeletonDescriptionLarge: {
    width: '100%',
    height: 18,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceMuted,
  },
  skeletonDescriptionSmall: {
    width: '72%',
    height: 18,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceMuted,
  },
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  skeletonPrice: {
    width: 90,
    height: 24,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.surfaceMuted,
  },
  skeletonControls: {
    width: 140,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surfaceMuted,
  },
  skeletonButton: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
    marginTop: Spacing.sm,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  description: {
    color: Colors.light.textMuted,
    lineHeight: 22,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  qtyButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
  },
  qtyButtonDisabled: {
    backgroundColor: Colors.light.surfaceMuted,
    borderColor: Colors.light.border,
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    minWidth: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
