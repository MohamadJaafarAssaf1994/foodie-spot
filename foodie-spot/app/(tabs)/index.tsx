import React, { useCallback, useEffect, useState } from 'react';
import { ShoppingBag, MapPin, Search } from 'lucide-react-native';
import { FlatList, ListRenderItem, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { CategoryList } from '@/components/category-list';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { RestaurantCard } from '@/components/restaurant-card';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useHomeRestaurants } from '@/hooks/use-home-restaurants';
import { cart } from '@/services/cart';
import { Restaurant } from '@/types';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const {
    restaurants,
    categories,
    selectedCategory,
    location,
    promo,
    loading,
    refreshing,
    error,
    refreshRestaurants,
    selectCategory,
    retryLoadRestaurants,
  } = useHomeRestaurants();
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const [cartCount, setCartCount] = useState(0);
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const loadCartCount = useCallback(async () => {
    const items = await cart.getCart();
    setCartCount(cart.getTotals(items).itemCount);
  }, []);

  useEffect(() => {
    void loadCartCount();
  }, [loadCartCount]);

  useFocusEffect(
    useCallback(() => {
      void loadCartCount();
    }, [loadCartCount])
  );

  const renderRestaurant = useCallback<ListRenderItem<Restaurant>>(
    ({ item }) => (
      <RestaurantCard
        restaurant={item}
        onPress={() => router.push(`/restaurant/${item.id}`)}
      />
    ),
    []
  );

  const keyExtractor = useCallback((item: Restaurant) => item.id, []);
  const localizedPromoTitle = promo?.code === 'BIENVENUE30'
    ? t('promo_welcome30_title')
    : promo?.title;
  const promoTitle = localizedPromoTitle
    ? localizedPromoTitle.toLowerCase().includes('30%')
      ? localizedPromoTitle
      : `${promo?.discountLabel ?? ''} ${localizedPromoTitle}`.trim()
    : t('promo_default_title');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.locationContainer}>
            <MapPin size={20} color="#fff" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>{t('home_delivery_to')} </Text>
              <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.cartButton} onPress={() => router.push('/cart')}>
            <ShoppingBag size={20} color={colors.primary} />
            {cartCount > 0 ? (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/search')}>
        <Search size={20} color={colors.textMuted} />
        <Text style={styles.searchPlaceholder}>{t('home_search_placeholder')}</Text>
        </TouchableOpacity>
      </View>


      <FlatList
        data={!loading && !error ? restaurants : []}
        keyExtractor={keyExtractor}
        renderItem={renderRestaurant}
        showsVerticalScrollIndicator={false}
        style={styles.content}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshRestaurants} />}
        ListHeaderComponent={(
          <>
            <View style={styles.promoBanner}>
              <Text style={styles.promoLabel}>{t('home_promo_badge')}</Text>
              <Text style={styles.promoTitle}>{promoTitle}</Text>
              <Text style={styles.promoCode}>
                {t('promo_default_code')}: {promo?.code ?? 'FOODIE30'}
              </Text>
            </View>

            <CategoryList
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={category => void selectCategory(category)}
              title={t('category_title')}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home_nearby')}</Text>
            </View>

            {loading && !refreshing && (
              <View style={styles.sectionContent}>
                <LoadingState message={t('home_loading_restaurants')} />
              </View>
            )}

            {!loading && !!error && (
              <View style={styles.sectionContent}>
                <ErrorState message={error} onAction={retryLoadRestaurants} />
              </View>
            )}

            {!loading && !error && restaurants.length === 0 && (
              <View style={styles.sectionContent}>
                <EmptyState title={t('home_no_restaurants')} />
              </View>
            )}
          </>
        )}
      />

    </SafeAreaView>
  );

};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: Spacing.lg,
    paddingBottom: 20,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  locationLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: colors.textSubtle,
  },
  content : {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  promoBanner: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: colors.secondary,
    borderRadius: Radius.lg,
  },
  promoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },

  promoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  promoCode: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sectionHeader: {
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  sectionContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
});
