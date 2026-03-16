import type { SearchFilters } from '@/types';

export interface HomeCoordinates {
  latitude: number;
  longitude: number;
}

export const buildNearbyRestaurantFilters = (coords: HomeCoordinates, radius = 5): SearchFilters => ({
  lat: coords.latitude,
  lng: coords.longitude,
  radius,
  sortBy: 'distance',
});

export const resolveHomeLocationLabel = (
  address: string | null,
  fallbackLabel: string,
  coords?: HomeCoordinates
): string => {
  if (address && address.trim()) {
    return address;
  }

  if (coords) {
    return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
  }

  return fallbackLabel;
};
