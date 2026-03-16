import * as Location from 'expo-location';
import config from '@/constants/config';

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export interface PermissionResult {
    granted: boolean;
    canAskAgain: boolean;
}

export type LocationStatusKey =
    | 'home_location_available'
    | 'home_location_permission_prompt'
    | 'home_location_permission_denied'
    | 'home_location_unknown';

export const locationService = {

    async requestPermissions(): Promise<PermissionResult> {
        try {
            const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
            return {
                granted: status === 'granted',
                canAskAgain,
            };
        } catch (error) {
            return {
                granted: false,
                canAskAgain: false,
            };
        }
    },

    async getCurrentLocation(): Promise<Coordinates | null> {
        try {
            const permission = await this.requestPermissions();
            if (!permission.granted) {
                return null;
            }

            const { coords } = await Location.getCurrentPositionAsync();
            return {
                latitude: coords.latitude,
                longitude: coords.longitude,
            };
        } catch (error) {
            // log.warn('Failed to get current location', error);
            return null;
        }
    },

    async getLocationStatusKey(): Promise<LocationStatusKey> {
        const permission = await this.requestPermissions();
        if (permission.granted) {
            return 'home_location_available';
        }

        return permission.canAskAgain
            ? 'home_location_permission_prompt'
            : 'home_location_permission_denied';
    },

    async reverseGeoCode(coordinates: Coordinates): Promise<string | null> {
        try {
            const addresses = await Location.reverseGeocodeAsync(coordinates);
            if (addresses.length >0) {
                const address = addresses[0];
                const primary = [
                    address.name,
                    address.street,
                    address.district,
                    address.city,
                    address.subregion,
                    address.region,
                ]
                    .filter((value, index, array): value is string => !!value && array.indexOf(value) === index)
                    .slice(0, 2)
                    .join(', ');

                const fallback = [
                    address.name,
                    address.street,
                    address.district,
                    address.city,
                    address.subregion,
                    address.region,
                    address.country,
                ]
                    .filter((value, index, array): value is string => !!value && array.indexOf(value) === index)
                    .join(', ');

                return primary || fallback || null;
            }
        } catch (error) {
            // log.warn('Failed to reverse geocode', error);
        }

        try {
            const searchParams = new URLSearchParams({
                lat: String(coordinates.latitude),
                lng: String(coordinates.longitude),
            });
            const response = await fetch(`${config.API_URL}geo/reverse?${searchParams.toString()}`);
            if (!response.ok) {
                return null;
            }

            const payload = await response.json();
            return payload?.data?.label ?? null;
        } catch {
            return null;
        }
    }
}
    
