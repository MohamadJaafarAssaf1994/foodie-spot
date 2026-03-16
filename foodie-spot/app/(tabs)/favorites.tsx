import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, ListRenderItem, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { RestaurantCard } from '@/components/restaurant-card';
import { Colors, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { profileAPI } from '@/services/api';
import type { Restaurant } from '@/types';

export default function FavoritesScreen() {
  const { t } = useI18n();
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async () => {
    try {
      setError(null);
      const data = await profileAPI.getFavoriteRestaurants();
      setFavorites(data);
    } catch {
      setError(t('favorites_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  const refreshFavorites = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, [loadFavorites]);

  const renderItem = useCallback<ListRenderItem<Restaurant>>(
    ({ item }) => (
      <RestaurantCard
        restaurant={item}
        onPress={() => router.push(`/restaurant/${item.id}`)}
      />
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('favorites_title')}</Text>
      </View>

      <FlatList
        data={!loading && !error ? favorites : []}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshFavorites} />}
        ListEmptyComponent={
          loading && !refreshing ? (
            <LoadingState message={t('favorites_loading')} />
          ) : !loading && error ? (
            <ErrorState message={error} onAction={loadFavorites} />
          ) : (
            <EmptyState
              title={t('favorites_empty')}
              illustration={<Heart size={52} color={Colors.light.textSubtle} />}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    flexGrow: 1,
  },
});
