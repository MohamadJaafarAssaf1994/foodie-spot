import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { RestaurantCard } from "@/components/restaurant-card";
import { Colors } from "@/constants/theme";
import { useRestaurantSearch } from "@/hooks/use-restaurant-search";
import { Filter, Search } from "lucide-react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
    const router = useRouter();
    const {
        query,
        restaurants,
        filters,
        showFilters,
        loading,
        error,
        setQuery,
        toggleFilters,
        toggleCuisineFilter,
    } = useRestaurantSearch();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Search size={24} color={Colors.light.text} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Rechercher un restaurant"
                        value={query}
                        onChangeText={setQuery}
                    />
                </View>
                <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
                    <Filter size={24} color={Colors.light.text} />
                </TouchableOpacity>
            </View>

            {
                showFilters && (
                    <View style={styles.filters}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {['Burger', 'Pizza', 'Sushi', 'Healthy', 'Desserts'].map((cuisine) => (
                                <TouchableOpacity key={cuisine} style={styles.filterChip}
                                    onPress={() => toggleCuisineFilter(cuisine)}>
                                    <Text style={[styles.filterChipText, filters.cuisine === cuisine && styles.filterChipTextActive]}>{cuisine}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )
            }

            <ScrollView style={styles.content}>
                <Text style={styles.resultsText}>

                    {restaurants.length} {restaurants.length > 1 ? 'restaurants' : 'restaurant'} trouvés
                </Text>
                {loading ? (
                    <LoadingState message="Chargement des restaurants..." />
                ) : null}
                {!loading && error ? <ErrorState message={error} /> : null}
                {restaurants.map((restaurant) => (
                    <RestaurantCard key={restaurant.id} restaurant={restaurant} onPress={() => router.push(`/restaurant/${restaurant.id}`)} />
                ))}
                {!loading && !error && restaurants.length === 0 ? <EmptyState title="Aucun restaurant trouvé" /> : null}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 24,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    filterButton: {
        padding: 8,
    },
    filters: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        marginRight: 8,
    },
    filterChipText: {
        fontSize: 14,
        color: '#666',
    },
    filterChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    resultsText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
});
