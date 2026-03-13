import { Restaurant } from '@/types';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { Image } from 'expo-image';
import { Clock, MapPin, Star } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


interface Props {
    restaurant: Restaurant;
    onPress?: () => void;
    compact?: boolean;
}

export const RestaurantCard: React.FC<Props> = ({ restaurant, onPress, compact }) => {
    return (
        <TouchableOpacity
            style={[styles.card, compact && styles.compact]}
            accessibilityRole="button"
            accessibilityLabel={`Ouvrir le restaurant ${restaurant.name}`}
            activeOpacity={0.85}
            onPress={onPress}
        >
            <Image source={{ uri: restaurant.image }} style={[styles.image, compact && styles.compactImage]} />

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.name} numberOfLines={1}>{restaurant.name}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{restaurant.priceRange}</Text>
                    </View>
                </View>

                <Text style={styles.cuisine}>{restaurant.cuisine}</Text>
                <View style={styles.meta}>
                    <View style={styles.metaItem}>
                        <Star size={16} color={Colors.light.primary} />
                        <Text style={styles.metaText}>{restaurant.rating} {restaurant.reviewsCount} avis</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Clock size={16} color={Colors.light.primary} />
                        <Text style={styles.metaText}>
                            {typeof restaurant.deliveryTime === 'object' 
                                ? `${restaurant.deliveryTime.min}-${restaurant.deliveryTime.max}` 
                                : restaurant.deliveryTime} min
                        </Text>
                    </View>

                    <View style={styles.metaItem}>
                        <MapPin size={16} color={Colors.light.primary} />
                        <Text style={styles.metaText}>{restaurant.distance ?? 15} km</Text>
                    </View>
                    {!compact && <Text style={styles.description} numberOfLines={2}>{restaurant.description}</Text>}

                </View>
            </View>



        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        marginBottom: Spacing.lg,
        backgroundColor: Colors.light.surface,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    compact: {
        marginBottom: Spacing.md,
    },
    image: {
        width: 120,
        height: 120,
    },
    compactImage: {
        width: 100,
        height: 100,
    },
    content: {
        flex: 1,
        padding: Spacing.md,
        gap: 6
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
    },
    name: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
    },
    badge: {
        backgroundColor: Colors.light.surfaceMuted,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: Radius.sm,
    },
    badgeText: {
        color: Colors.light.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    cuisine: {
        color: Colors.light.textMuted,
        fontSize: 13
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    metaText: {
        fontSize: 12,
        color: Colors.light.text,
    },

    description: {
        fontSize: 12,
        color: Colors.light.textMuted,
    }
});
