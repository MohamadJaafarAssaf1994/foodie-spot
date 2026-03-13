import { useCallback, useEffect, useState } from 'react';

import { restaurantAPI } from '@/services/api';
import { Restaurant, SearchFilters } from '@/types';

export function useRestaurantSearch() {
  const [query, setQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRestaurants = useCallback(async () => {
    try {
      setError(null);
      const data = query
        ? await restaurantAPI.searchRestaurants(query)
        : await restaurantAPI.getRestaurants(filters);
      setRestaurants(data);
    } catch {
      setError('Impossible de charger les restaurants.');
    } finally {
      setLoading(false);
    }
  }, [filters, query]);

  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const toggleCuisineFilter = useCallback((cuisine: string) => {
    setFilters(prev => ({
      ...prev,
      cuisine: prev.cuisine === cuisine ? undefined : cuisine,
    }));
  }, []);

  useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  return {
    query,
    restaurants,
    filters,
    showFilters,
    loading,
    error,
    setQuery,
    toggleFilters,
    toggleCuisineFilter,
    retrySearch: loadRestaurants,
  };
}

export default useRestaurantSearch;
