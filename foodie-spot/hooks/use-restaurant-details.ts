import { useCallback, useEffect, useMemo, useState } from 'react';
import { Share } from 'react-native';

import { restaurantAPI } from '@/services/api';
import { auth } from '@/services/auth';
import { Dish, Restaurant } from '@/types';

export function useRestaurantDetails(id: string) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Dish[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRestaurantDetails = useCallback(async () => {
    try {
      setError(null);
      const [restaurantData, menuData] = await Promise.all([
        restaurantAPI.getRestaurantById(id),
        restaurantAPI.getMenu(id),
      ]);
      setRestaurant(restaurantData);
      setMenu(menuData);
      setIsFavorite(restaurantData?.isFavorite || false);
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
    isFavorite,
    loading,
    error,
    deliveryTimeLabel,
    toggleFavorite,
    shareRestaurant,
    retryLoadRestaurantDetails: loadRestaurantDetails,
  };
}

export default useRestaurantDetails;
