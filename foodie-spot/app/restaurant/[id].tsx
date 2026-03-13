import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useRestaurantDetails } from "@/hooks/use-restaurant-details";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { ArrowLeft, Clock, Heart, MapPin, Navigation, Phone, Share2, Star } from "lucide-react-native";
import { DishCard } from "@/components/dish-card";
import { Colors, Radius, Spacing } from "@/constants/theme";

export default function RestaurantScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const {
        restaurant,
        menu,
        isFavorite,
        loading,
        error,
        deliveryTimeLabel,
        toggleFavorite,
        shareRestaurant,
    } = useRestaurantDetails(id);

    if (loading && !restaurant) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <LoadingState message="Chargement du restaurant..." />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.imageContainer}>
                    <Image source={{ uri: restaurant?.image }} style={styles.image} />
                    <TouchableOpacity
                        style={styles.backButton}
                        accessibilityRole="button"
                        accessibilityLabel="Retour"
                        hitSlop={8}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={24} color="rgba(0,0,0)" />
                    </TouchableOpacity>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            accessibilityRole="button"
                            accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                            hitSlop={8}
                            onPress={toggleFavorite}
                        >
                            <Heart size={24} color={isFavorite ? Colors.light.primary : Colors.light.text} fill={isFavorite ? Colors.light.primary : 'transparent'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.actionButton}
                            accessibilityRole="button"
                            accessibilityLabel="Partager le restaurant"
                            hitSlop={8}
                            onPress={shareRestaurant}
                        >
                            <Share2 size={18} color={Colors.light.text} />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.info}>
                    {error ? <ErrorState message={error} /> : null}
                    <Text style={styles.name}>{restaurant?.name}</Text>
                    <Text style={styles.cuisine}>{restaurant?.cuisine}</Text>
                    <View style={styles.meta}>
                        <View style={styles.metaItem}>
                            <Star size={16} color={Colors.light.warning} fill={Colors.light.warning} />
                            <Text style={styles.metaText}>
                                {restaurant?.rating.toFixed(1)} ({restaurant?.reviewsCount})
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Clock size={16} color={Colors.light.textMuted}/>
                            <Text style={styles.metaText}>{deliveryTimeLabel}</Text>
                        </View>
                         <View style={styles.metaItem}>
                            <MapPin size={16} color={Colors.light.textMuted}/>
                            <Text style={styles.metaText}>
                                {restaurant?.distance} km
                            </Text>
                        </View>
                    </View>
                    <View style={styles.actions}>
                         <TouchableOpacity style={styles.primaryButton}>
                            <Navigation size={18} color="#fff" />
                            <Text style={styles.primaryButtonText}>Itinéraire</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.secondaryButton}>
                            <Phone size={18} color={Colors.light.textMuted} />
                            <Text style={styles.secondaryButtonText}>Appeler</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.menu}>
                    <Text style={styles.menuTitle}>Menu</Text>
                    {menu.map((dish) => (
                        <DishCard key={dish.id} dish={dish} onPress={() => router.push(`/dish/${dish.id}`)} />  
                        ))}  
                </View>


            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
        marginTop: -50,
    },
    imageContainer: {
        position: 'relative',
        height: 200,
    },
    image: {
        width: '100%',
        height: '100%'
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        width: 44,
        height: 44,
        borderRadius: Radius.pill,
        backgroundColor: Colors.light.surface,
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
        backgroundColor: Colors.light.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    cuisine: {
        fontSize: 16,
        color: Colors.light.textMuted,
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
        color: Colors.light.text,
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
        backgroundColor: Colors.light.primary,
        borderRadius: Radius.md,
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
        backgroundColor: Colors.light.surfaceMuted,
        borderRadius: Radius.md,
        padding: Spacing.md,
    },
    secondaryButtonText: {
        color: Colors.light.text,
        fontSize: 16,
        fontWeight: '600',
    },
    menu: {
        padding: Spacing.lg,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    }
});
