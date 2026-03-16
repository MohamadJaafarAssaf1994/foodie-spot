import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Share } from 'react-native';

import { restaurantAPI, reviewAPI } from '@/services/api';
import { auth } from '@/services/auth';
import { locationService } from '@/services/location';
import { Dish, Restaurant, RestaurantReview, RestaurantReviewStats } from '@/types';

const calculateDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusKm * c * 10) / 10;
};

export function useRestaurantDetails(id: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Dish[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
  const [reviewStats, setReviewStats] = useState<RestaurantReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRestaurantDetails = useCallback(async () => {
    try {
      setError(null);
      const [restaurantData, menuData, reviewsData, userCoords] = await Promise.all([
        restaurantAPI.getRestaurantById(id),
        restaurantAPI.getMenu(id),
        reviewAPI.getRestaurantReviews(id),
        locationService.getCurrentLocation(),
      ]);

      const restaurantWithDistance = (() => {
        if (!restaurantData || typeof restaurantData.distance === 'number') {
          return restaurantData;
        }

        const restaurantLocation = restaurantData as Restaurant & {
          latitude?: number;
          longitude?: number;
        };
        const latitude = restaurantLocation.coordinates?.latitude ?? restaurantLocation.latitude;
        const longitude = restaurantLocation.coordinates?.longitude ?? restaurantLocation.longitude;

        if (!userCoords || typeof latitude !== 'number' || typeof longitude !== 'number') {
          return restaurantData;
        }

        return {
          ...restaurantData,
          distance: calculateDistanceKm(
            userCoords.latitude,
            userCoords.longitude,
            latitude,
            longitude
          ),
        };
      })();

      setRestaurant(restaurantWithDistance);
      setMenu(menuData);
      setReviews(reviewsData.reviews);
      setReviewStats(reviewsData.stats);
      setIsFavorite(restaurantWithDistance?.isFavorite || false);
    } catch {
      setError('Impossible de charger le restaurant.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const toggleFavorite = useCallback(async () => {
    try {
      const favorites = await auth.toggleFavoriteRestaurant(id);
      setIsFavorite(favorites.includes(id));
      return true;
    } catch {
      setError('Impossible de mettre a jour les favoris.');
      return false;
    }
  }, [id]);

  const shareRestaurant = useCallback(async () => {
    if (!restaurant) {
      return false;
    }

    try {
      await Share.share({
        message: `Découvrez ${restaurant.name} sur FoodieSpot.`,
      });
      return true;
    } catch {
      setError('Impossible de partager le restaurant.');
      return false;
    }
  }, [restaurant]);

  const openDirections = useCallback(async () => {
    if (!restaurant) {
      return false;
    }

    const restaurantWithLocation = restaurant as Restaurant & {
      latitude?: number;
      longitude?: number;
      coordinates?: { latitude: number; longitude: number };
    };
    const latitude = restaurantWithLocation.coordinates?.latitude ?? restaurantWithLocation.latitude;
    const longitude = restaurantWithLocation.coordinates?.longitude ?? restaurantWithLocation.longitude;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      setError('Coordonnees du restaurant indisponibles.');
      return false;
    }

    const encodedLabel = encodeURIComponent(restaurant.name);
    const candidateUrls = Platform.select({
      ios: [
        `maps://?ll=${latitude},${longitude}&q=${encodedLabel}`,
        `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodedLabel}`,
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      ],
      android: [
        `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      ],
      default: [
        `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      ],
    }) || [];

    try {
      for (const url of candidateUrls) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return true;
        }
      }

      throw new Error('unsupported');
    } catch {
      setError('Impossible d’ouvrir l’itineraire.');
      return false;
    }
  }, [restaurant]);

  const callRestaurant = useCallback(async () => {
    if (!restaurant?.phone) {
      setError('Numero de telephone indisponible.');
      return false;
    }

    const sanitizedPhone = restaurant.phone.replace(/\s+/g, '');
    const candidateUrls = Platform.select({
      ios: [`telprompt:${sanitizedPhone}`, `tel:${sanitizedPhone}`],
      default: [`tel:${sanitizedPhone}`],
    }) || [];

    try {
      for (const url of candidateUrls) {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return true;
        }
      }

      throw new Error('unsupported');
    } catch {
      setError('Impossible d’appeler ce restaurant.');
      return false;
    }
  }, [restaurant]);

  const deliveryTimeLabel = useMemo(() => {
    if (!restaurant) {
      return '';
    }

    if (typeof restaurant.deliveryTime === 'number') {
      return `${restaurant.deliveryTime} min`;
    }

    return `${restaurant.deliveryTime.min}-${restaurant.deliveryTime.max} min`;
  }, [restaurant]);

  useEffect(() => {
    void loadRestaurantDetails();
  }, [loadRestaurantDetails]);

  return {
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
    retryLoadRestaurantDetails: loadRestaurantDetails,
  };
}

export default useRestaurantDetails;
