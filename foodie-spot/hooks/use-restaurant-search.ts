import { useCallback, useEffect, useRef, useState } from 'react';

import { categoryAPI, restaurantAPI } from '@/services/api';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { locationService } from '@/services/location';
import { STORAGE_KEYS, storage } from '@/services/storage';
import { Category, Restaurant, SearchFilters } from '@/types';

const MAX_RECENT_SEARCHES = 6;

type FilterableRestaurant = Restaurant & {
  cuisine?: string | string[];
  categories?: string[];
};

const normalizeCategoryName = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const normalizeCategoryValues = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map(normalizeCategoryName).filter(Boolean);
  }

  const normalized = normalizeCategoryName(value);
  return normalized ? [normalized] : [];
};

export function useRestaurantSearch() {
  const [query, setQuery] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebouncedValue(query, 350);
  const menuCategoryCache = useRef<Record<string, string[]>>({});

  const applyCuisineFilter = useCallback(async (baseRestaurants: Restaurant[], cuisine?: string) => {
    if (!cuisine) {
      return baseRestaurants;
    }

    const targetCategory = normalizeCategoryName(cuisine);
    const filteredRestaurants: Restaurant[] = [];

    for (const restaurant of baseRestaurants) {
      const filterableRestaurant = restaurant as FilterableRestaurant;
      const restaurantLabels = [
        ...normalizeCategoryValues(filterableRestaurant.cuisine),
        ...normalizeCategoryValues(filterableRestaurant.categories),
      ];

      const cuisineMatch = restaurantLabels.some(label =>
        label === targetCategory ||
        label.includes(targetCategory) ||
        targetCategory.includes(label)
      );

      let knownCategories = menuCategoryCache.current[restaurant.id];

      if (!knownCategories) {
        try {
          const dishes = await restaurantAPI.getMenu(restaurant.id);
          knownCategories = dishes
            .map(dish => normalizeCategoryName(dish.category || ''))
            .filter(Boolean);
          menuCategoryCache.current[restaurant.id] = knownCategories;
        } catch {
          knownCategories = [];
        }
      }

      const dishMatch = knownCategories.some(dishCategory =>
        dishCategory === targetCategory ||
        dishCategory.includes(targetCategory) ||
        targetCategory.includes(dishCategory)
      );

      if (cuisineMatch || dishMatch) {
        filteredRestaurants.push(restaurant);
      }
    }

    return filteredRestaurants;
  }, []);

  const loadRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const coords = await locationService.getCurrentLocation();
      const locationFilters = coords
        ? {
            lat: coords.latitude,
            lng: coords.longitude,
            sortBy: 'distance' as const,
          }
        : undefined;

      const data = debouncedQuery
        ? await restaurantAPI.searchRestaurants(debouncedQuery, locationFilters)
        : await restaurantAPI.getRestaurants({
            ...filters,
            cuisine: undefined,
            ...locationFilters,
          });

      const filteredData = await applyCuisineFilter(data, filters.cuisine);
      setRestaurants(filteredData);
    } catch {
      setError('Impossible de charger les restaurants.');
    } finally {
      setLoading(false);
    }
  }, [applyCuisineFilter, debouncedQuery, filters]);

  const loadCategories = useCallback(async () => {
    const data = await categoryAPI.getCategories();
    setCategories(data);
  }, []);

  const loadRecentSearches = useCallback(async () => {
    const storedSearches = await storage.getItem<string[]>(STORAGE_KEYS.RECENT_SEARCHES);
    setRecentSearches(Array.isArray(storedSearches) ? storedSearches : []);
  }, []);

  const persistRecentSearch = useCallback(async (term: string) => {
    const normalizedTerm = term.trim();
    if (normalizedTerm.length < 2) {
      return;
    }

    const nextRecentSearches = [
      normalizedTerm,
      ...recentSearches.filter(item => item.toLowerCase() !== normalizedTerm.toLowerCase()),
    ].slice(0, MAX_RECENT_SEARCHES);

    setRecentSearches(nextRecentSearches);
    await storage.setItem(STORAGE_KEYS.RECENT_SEARCHES, nextRecentSearches);
  }, [recentSearches]);

  const clearRecentSearches = useCallback(async () => {
    setRecentSearches([]);
    await storage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  }, []);

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

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadRecentSearches();
  }, [loadRecentSearches]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      return;
    }

    void persistRecentSearch(debouncedQuery);
  }, [debouncedQuery, persistRecentSearch]);

  const suggestions = (() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    const knownValues = [
      ...restaurants.map(restaurant => restaurant.name),
      ...restaurants.flatMap(restaurant => normalizeCategoryValues((restaurant as FilterableRestaurant).cuisine)),
      ...categories.map(category => category.name),
    ];

    return Array.from(new Set(knownValues))
      .filter(Boolean)
      .filter(value => value.toLowerCase().includes(normalizedQuery))
      .filter(value => value.toLowerCase() !== normalizedQuery)
      .slice(0, 6);
  })();

  return {
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
    retrySearch: loadRestaurants,
  };
}

export default useRestaurantSearch;
