import { useCallback, useEffect, useState } from 'react';

import { restaurantAPI } from '@/services/api';
import { locationService } from '@/services/location';
import { Restaurant } from '@/types';

export function useHomeRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [location, setLocation] = useState('Locating...');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRestaurants = useCallback(async () => {
    try {
      setError(null);
      const data = await restaurantAPI.getRestaurants();
      setRestaurants(data);
    } catch {
      setError('Impossible de charger les restaurants.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLocation = useCallback(async () => {
    const coords = await locationService.getCurrentLocation();
    if (!coords) {
      return;
    }

    const address = await locationService.reverseGeoCode(coords);
    if (address) {
      setLocation(address);
    }
  }, []);

  const refreshRestaurants = useCallback(async () => {
    setRefreshing(true);
    await loadRestaurants();
    setRefreshing(false);
  }, [loadRestaurants]);

  useEffect(() => {
    void loadRestaurants();
    void loadLocation();
  }, [loadLocation, loadRestaurants]);

  return {
    restaurants,
    location,
    loading,
    refreshing,
    error,
    refreshRestaurants,
    retryLoadRestaurants: loadRestaurants,
  };
}

export default useHomeRestaurants;
