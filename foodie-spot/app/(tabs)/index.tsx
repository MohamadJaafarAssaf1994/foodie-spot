import { MapPin, Search } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CategoryList } from '@/components/category-list';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { RestaurantCard } from '@/components/restaurant-card';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useHomeRestaurants } from '@/hooks/use-home-restaurants';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const {
    restaurants,
    location,
    loading,
    refreshing,
    error,
    refreshRestaurants,
    retryLoadRestaurants,
  } = useHomeRestaurants();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <MapPin size={20} color="#fff" />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Livraison à </Text>
            <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(tabs)/search')}>
        <Search size={20} color="#666" />
        <Text style={styles.searchPlaceholder}>Rechercher un restaurant...</Text>
        </TouchableOpacity>
      </View>


      <ScrollView showsVerticalScrollIndicator={false} style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshRestaurants} />}>
         <View style={styles.promoBanner}>
          <Text style={styles.promoLabel}>Offre spéciale</Text>
          <Text style={styles.promoTitle}>-30% sur votre première commande</Text>
          <Text style={styles.promoCode}>Code: FOODIE30</Text>
         </View>

          <CategoryList />

          <View style={styles.section}>
              <Text style={styles.sectionTitle}> A proximité</Text>
              {loading && !refreshing && (
                <LoadingState message="Chargement des restaurants..." />
              )}

              {!loading && !!error && (
                <ErrorState message={error} onAction={retryLoadRestaurants} />
              )}

              {!loading && !error && restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} onPress={() => router.push(`/restaurant/${restaurant.id}`)} />
              ))}
              {!loading && !error && restaurants.length === 0 && <EmptyState title="Aucun restaurant trouvé" />}
          </View>

      </ScrollView>

    </SafeAreaView>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.primary,
    padding: Spacing.lg,
    paddingBottom: 20,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
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
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.textSubtle,
  },
  content : {
    flex: 1,
  },
  promoBanner: {
    margin: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.light.secondary,
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
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
});
