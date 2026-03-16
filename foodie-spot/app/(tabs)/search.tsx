import React, { useCallback } from "react";
import { FlatList, ListRenderItem, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { RestaurantCard } from "@/components/restaurant-card";
import { localizeCategoryName } from "@/constants/content-translations";
import { Colors } from "@/constants/theme";
import { useI18n } from "@/contexts/i18n-context";
import { useAppTheme } from '@/contexts/theme-context';
import { useRestaurantSearch } from "@/hooks/use-restaurant-search";
import { Category, Restaurant } from "@/types";
import { Filter, Search } from "lucide-react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
    const router = useRouter();
    const { t, locale } = useI18n();
    const { colors } = useAppTheme();
    const {
        query,
        categories,
        restaurants,
        recentSearches,
        suggestions,
        filters,
        showFilters,
        loading,
        error,
        setQuery,
        clearRecentSearches,
        toggleFilters,
        toggleCuisineFilter,
        retrySearch,
    } = useRestaurantSearch();

    const renderRestaurant = useCallback<ListRenderItem<Restaurant>>(
        ({ item }) => (
            <RestaurantCard
                restaurant={item}
                onPress={() => router.push(`/restaurant/${item.id}`)}
            />
        ),
        [router]
    );

    const keyExtractor = useCallback((item: Restaurant) => item.id, []);
    const categoryKeyExtractor = useCallback((item: Category) => item.id, []);
    const hasQuery = query.trim().length > 0;
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    const headerContent = (
        <>
            {!hasQuery && recentSearches.length > 0 ? (
                <View style={styles.helperSection}>
                    <View style={styles.helperHeader}>
                        <Text style={styles.helperTitle}>{t('search_recent_title')}</Text>
                        <TouchableOpacity onPress={() => void clearRecentSearches()}>
                            <Text style={styles.helperAction}>{t('search_recent_clear')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.helperChips}>
                        {recentSearches.map(item => (
                            <TouchableOpacity key={item} style={styles.helperChip} onPress={() => setQuery(item)}>
                                <Text style={styles.helperChipText}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ) : null}

            {hasQuery && suggestions.length > 0 ? (
                <View style={styles.helperSection}>
                    <Text style={styles.helperTitle}>{t('search_suggestions_title')}</Text>
                    <View style={styles.helperChips}>
                        {suggestions.map(item => (
                            <TouchableOpacity key={item} style={styles.helperChip} onPress={() => setQuery(item)}>
                                <Text style={styles.helperChipText}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ) : null}

            <Text style={styles.resultsText}>
                {restaurants.length > 1
                    ? t('search_results_count_plural', { count: restaurants.length })
                    : t('search_results_count', { count: restaurants.length })}
            </Text>
        </>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <Search size={24} color={colors.text} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('search_placeholder')}
                        value={query}
                        onChangeText={setQuery}
                    />
                </View>
                <TouchableOpacity style={styles.filterButton} onPress={toggleFilters}>
                    <Filter size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {
                showFilters && (
                    <View style={styles.filters}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={categoryKeyExtractor(category)}
                                    style={[
                                        styles.filterChip,
                                        filters.cuisine === category.name && styles.filterChipActive,
                                    ]}
                                    onPress={() => toggleCuisineFilter(category.name)}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            filters.cuisine === category.name && styles.filterChipTextActive,
                                        ]}
                                    >
                                        {category.icon
                                            ? `${category.icon} ${localizeCategoryName(category, locale)}`
                                            : localizeCategoryName(category, locale)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )
            }

            <FlatList
                data={!loading && !error ? restaurants : []}
                keyExtractor={keyExtractor}
                renderItem={renderRestaurant}
                style={styles.content}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                ListHeaderComponent={headerContent}
                ListEmptyComponent={
                    loading ? (
                        <LoadingState message={t('search_loading')} />
                    ) : error ? (
                        <ErrorState message={error} onAction={retrySearch} />
                    ) : (
                        <EmptyState title={t('search_empty')} />
                    )
                }
            />
        </SafeAreaView>
    );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.surfaceMuted,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderRadius: 24,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
    },
    filterButton: {
        padding: 8,
    },
    filters: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.surfaceMuted,
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
    },
    filterChipText: {
        fontSize: 14,
        color: colors.textMuted,
    },
    filterChipTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 24,
        flexGrow: 1,
    },
    resultsText: {
        fontSize: 14,
        color: colors.textMuted,
        marginBottom: 16,
    },
    helperSection: {
        marginBottom: 16,
        gap: 10,
    },
    helperHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    helperTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    helperAction: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    helperChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    helperChip: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    helperChipText: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '500',
    },
});
