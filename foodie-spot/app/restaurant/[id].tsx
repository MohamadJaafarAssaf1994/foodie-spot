import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, Clock, Heart, MapPin, Navigation, Phone, Share2, Star } from 'lucide-react-native';

import { DishCard } from '@/components/dish-card';
import { ErrorState } from '@/components/error-state';
import { AppImages } from '@/constants/assets';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useRestaurantDetails } from '@/hooks/use-restaurant-details';

export default function RestaurantScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useI18n();
    const { colors } = useAppTheme();
    const {
        restaurant,
        menu,
        reviews,
        reviewStats,
        isFavorite,
        loading,
        error,
        deliveryTimeLabel,
        toggleFavorite,
        shareRestaurant,
        openDirections,
        callRestaurant,
        retryLoadRestaurantDetails,
    } = useRestaurantDetails(id);
    const styles = React.useMemo(() => createStyles(colors), [colors]);

    if (loading && !restaurant) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.skeletonScreen}>
                    <View style={styles.skeletonHero} />
                    <View style={styles.skeletonContent}>
                        <View style={styles.skeletonTitle} />
                        <View style={styles.skeletonSubtitle} />
                        <View style={styles.skeletonMetaRow}>
                            <View style={styles.skeletonMetaPill} />
                            <View style={styles.skeletonMetaPill} />
                            <View style={styles.skeletonMetaPill} />
                        </View>
                        <View style={styles.skeletonActions}>
                            <View style={styles.skeletonActionButton} />
                            <View style={styles.skeletonActionButton} />
                        </View>
                        <View style={styles.skeletonMenuTitle} />
                        <View style={styles.skeletonMenuCard} />
                        <View style={styles.skeletonMenuCard} />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    if (!restaurant) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <ErrorState message={error || 'Restaurant introuvable.'} onAction={retryLoadRestaurantDetails} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <Image
                        source={restaurant.image ? { uri: restaurant.image } : AppImages.imagePlaceholder}
                        placeholder={AppImages.imagePlaceholder}
                        cachePolicy="memory-disk"
                        contentFit="cover"
                        transition={180}
                        style={styles.image}
                    />
                    <TouchableOpacity
                        style={styles.backButton}
                        accessibilityRole="button"
                        accessibilityLabel="Retour"
                        hitSlop={8}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            accessibilityRole="button"
                            accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            hitSlop={8}
                            onPress={toggleFavorite}
                        >
                            <Heart size={24} color={isFavorite ? colors.primary : colors.text} fill={isFavorite ? colors.primary : 'transparent'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            accessibilityRole="button"
                            accessibilityLabel="Partager le restaurant"
                            hitSlop={8}
                            onPress={shareRestaurant}
                        >
                            <Share2 size={18} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.info}>
                    {error ? <ErrorState message={error} /> : null}
                    <Text style={styles.name}>{restaurant.name}</Text>
                    <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
                    <View style={styles.meta}>
                        <View style={styles.metaItem}>
                            <Star size={16} color={colors.warning} fill={colors.warning} />
                            <Text style={styles.metaText}>
                                {restaurant.rating.toFixed(1)} ({restaurant.reviewsCount})
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Clock size={16} color={colors.textMuted} />
                            <Text style={styles.metaText}>{deliveryTimeLabel}</Text>
                        </View>
                        <View style={styles.metaItem}>
                            <MapPin size={16} color={colors.textMuted} />
                            <Text style={styles.metaText}>
                                {typeof restaurant.distance === 'number' ? `${restaurant.distance} km` : t('home_location_unknown')}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.primaryButton} onPress={openDirections}>
                            <Navigation size={18} color="#fff" />
                            <Text style={styles.primaryButtonText}>{t('restaurant_action_directions')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton} onPress={callRestaurant}>
                            <Phone size={18} color={colors.textMuted} />
                            <Text style={styles.secondaryButtonText}>{t('restaurant_action_call')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.sectionTitle}>{t('restaurant_menu_title')}</Text>
                    {menu.map(dish => (
                        <DishCard
                            key={dish.id}
                            dish={dish}
                            onPress={() => router.push({ pathname: '/dish/[id]', params: { id: dish.id, restaurantId: restaurant.id } })}
                        />
                    ))}
                </View>

                <View style={styles.reviewsSection}>
                    <Text style={styles.sectionTitle}>{t('restaurant_reviews_title')}</Text>

                    {reviewStats ? (
                        <View style={styles.reviewSummary}>
                            <Text style={styles.reviewSummaryAverage}>{reviewStats.average.toFixed(1)}</Text>
                            <Text style={styles.reviewSummaryMeta}>
                                {reviewStats.total} {t('profile_reviews').toLowerCase()}
                            </Text>
                        </View>
                    ) : null}

                    {reviews.length === 0 ? (
                        <Text style={styles.reviewEmpty}>{t('restaurant_reviews_empty')}</Text>
                    ) : (
                        reviews.slice(0, 3).map(review => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <View style={styles.reviewHeaderText}>
                                        <Text style={styles.reviewUser}>{review.userName}</Text>
                                        <Text style={styles.reviewMeta}>
                                            {review.rating.toFixed(1)} ★
                                            {review.isVerifiedPurchase ? ` • ${t('restaurant_reviews_verified')}` : ''}
                                        </Text>
                                    </View>
                                    <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                                </View>

                                {(review.qualityRating || review.speedRating || review.presentationRating) ? (
                                    <View style={styles.criteriaBadges}>
                                        {review.qualityRating ? <Text style={styles.criteriaBadge}>{t('review_quality')}: {review.qualityRating}/5</Text> : null}
                                        {review.speedRating ? <Text style={styles.criteriaBadge}>{t('review_speed')}: {review.speedRating}/5</Text> : null}
                                        {review.presentationRating ? <Text style={styles.criteriaBadge}>{t('review_presentation')}: {review.presentationRating}/5</Text> : null}
                                    </View>
                                ) : null}

                                {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}

                                {review.images.length > 0 ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewImagesRow}>
                                        {review.images.map(image => (
                                            <Image
                                                key={image}
                                                source={{ uri: image }}
                                                placeholder={AppImages.imagePlaceholder}
                                                style={styles.reviewImage}
                                                contentFit="cover"
                                            />
                                        ))}
                                    </ScrollView>
                                ) : null}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        marginTop: -50,
    },
    skeletonScreen: {
        flex: 1,
    },
    skeletonHero: {
        height: 220,
        backgroundColor: colors.surfaceMuted,
    },
    skeletonContent: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    skeletonTitle: {
        width: '68%',
        height: 28,
        borderRadius: Radius.sm,
        backgroundColor: colors.surfaceMuted,
    },
    skeletonSubtitle: {
        width: '42%',
        height: 18,
        borderRadius: Radius.sm,
        backgroundColor: colors.surfaceMuted,
    },
    skeletonMetaRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    skeletonMetaPill: {
        flex: 1,
        height: 18,
        borderRadius: Radius.pill,
        backgroundColor: colors.surfaceMuted,
    },
    skeletonActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    skeletonActionButton: {
        flex: 1,
        height: 48,
        borderRadius: Radius.md,
        backgroundColor: colors.surfaceMuted,
    },
    skeletonMenuTitle: {
        width: 96,
        height: 22,
        borderRadius: Radius.sm,
        backgroundColor: colors.surfaceMuted,
        marginTop: Spacing.sm,
    },
    skeletonMenuCard: {
        height: 108,
        borderRadius: Radius.lg,
        backgroundColor: colors.surfaceMuted,
    },
    imageContainer: {
        position: 'relative',
        height: 200,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        width: 44,
        height: 44,
        borderRadius: Radius.pill,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActions: {
        position: 'absolute',
        top: 16,
        right: 16,
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionButton: {
        marginTop: 34,
        width: 48,
        height: 48,
        borderRadius: Radius.pill,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    cuisine: {
        fontSize: 16,
        color: colors.textMuted,
        marginBottom: 12,
    },
    meta: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 14,
        color: colors.text,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        borderRadius: Radius.md,
        padding: Spacing.md,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.surfaceMuted,
        borderRadius: Radius.md,
        padding: Spacing.md,
    },
    secondaryButtonText: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    menuSection: {
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 16,
    },
    reviewsSection: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
    reviewSummary: {
        backgroundColor: colors.surfaceMuted,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        alignItems: 'center',
    },
    reviewSummaryAverage: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.primary,
    },
    reviewSummaryMeta: {
        marginTop: Spacing.xs,
        color: colors.textMuted,
    },
    reviewEmpty: {
        color: colors.textMuted,
    },
    reviewCard: {
        backgroundColor: colors.surface,
        borderRadius: Radius.lg,
        padding: Spacing.md,
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    reviewHeaderText: {
        flex: 1,
    },
    reviewUser: {
        color: colors.text,
        fontWeight: '700',
    },
    reviewMeta: {
        color: colors.textMuted,
        marginTop: 2,
        fontSize: 13,
    },
    reviewDate: {
        color: colors.textSubtle,
        fontSize: 12,
    },
    criteriaBadges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    criteriaBadge: {
        backgroundColor: colors.surfaceMuted,
        color: colors.text,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radius.pill,
        fontSize: 12,
        fontWeight: '600',
    },
    reviewComment: {
        color: colors.text,
        lineHeight: 20,
    },
    reviewImagesRow: {
        gap: Spacing.sm,
    },
    reviewImage: {
        width: 96,
        height: 96,
        borderRadius: Radius.md,
    },
});
