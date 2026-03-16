import { useCallback, useEffect, useRef, useState } from 'react';

import { categoryAPI, homeAPI, restaurantAPI } from '@/services/api';
import { locationService } from '@/services/location';
import { useI18n } from '@/contexts/i18n-context';
import { Category, PromoBanner, Restaurant } from '@/types';
import { buildNearbyRestaurantFilters, resolveHomeLocationLabel } from '@/utils/home';

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

export function useHomeRestaurants() {
  const { t } = useI18n();
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [location, setLocation] = useState(t('home_location_unknown'));
  const [promo, setPromo] = useState<PromoBanner | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuCategoryCache = useRef<Record<string, string[]>>({});

  const loadRestaurants = useCallback(async () => {
    try {
      setError(null);
      const coords = await locationService.getCurrentLocation();

      if (!coords) {
        const statusKey = await locationService.getLocationStatusKey();
        setLocation(t(statusKey));
        const data = await restaurantAPI.getRestaurants();
        menuCategoryCache.current = {};
        setAllRestaurants(data);
        setRestaurants(data);
        return;
      }

      const address = await locationService.reverseGeoCode(coords);
      setLocation(resolveHomeLocationLabel(address, t('home_location_available'), coords));

      const data = await restaurantAPI.getRestaurants(buildNearbyRestaurantFilters(coords));
      menuCategoryCache.current = {};
      setAllRestaurants(data);
      setRestaurants(data);
    } catch {
      setError('Impossible de charger les restaurants.');
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadPromo = useCallback(async () => {
    const featuredPromo = await homeAPI.getFeaturedPromo();
    setPromo(featuredPromo);
  }, []);

  const loadCategories = useCallback(async () => {
    const nextCategories = await categoryAPI.getCategories();
    setCategories(nextCategories);
  }, []);

  const applyCategoryFilter = useCallback(async (categoryName: string | null, sourceRestaurants?: Restaurant[]) => {
    const nextRestaurants = sourceRestaurants || allRestaurants;

    if (!categoryName) {
      setError(null);
      setSelectedCategory(null);
      setRestaurants(nextRestaurants);
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedCategory(categoryName);

    try {
      const targetCategory = normalizeCategoryName(categoryName);
      const filteredRestaurants: Restaurant[] = [];

      for (const restaurant of nextRestaurants) {
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

      setRestaurants(filteredRestaurants);
    } catch {
      setError('Impossible de filtrer les restaurants.');
    } finally {
      setLoading(false);
    }
  }, [allRestaurants]);

  const refreshRestaurants = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRestaurants(), loadPromo(), loadCategories()]);
    setRefreshing(false);
  }, [loadCategories, loadPromo, loadRestaurants]);

  useEffect(() => {
    void loadRestaurants();
    void loadPromo();
    void loadCategories();
  }, [loadCategories, loadPromo, loadRestaurants]);

  useEffect(() => {
    if (selectedCategory && allRestaurants.length > 0) {
      void applyCategoryFilter(selectedCategory, allRestaurants);
    }
  }, [allRestaurants, applyCategoryFilter, selectedCategory]);

  return {
    restaurants,
    categories,
    selectedCategory,
    location,
    promo,
    loading,
    refreshing,
    error,
    refreshRestaurants,
    selectCategory: applyCategoryFilter,
    retryLoadRestaurants: loadRestaurants,
  };
}

export default useHomeRestaurants;
