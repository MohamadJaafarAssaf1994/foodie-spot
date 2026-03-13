import { cache } from '@/services/cache';
import NetInfo from '@react-native-community/netinfo';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { storage, STORAGE_KEYS } from '@/services/storage';
import { auth } from './auth'; // used to fetch token from SecureStore
import { Dish, Order, Restaurant, SearchFilters, User } from '@/types';
import log from './logger';
import config from '@/constants/config';


const api = axios.create({
    baseURL: config.API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const AUTH_EXCLUDED_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

api.interceptors.request.use(
    async requestConfig => {
        const token = await auth.getAccessToken();
        if (token) {
            requestConfig.headers.Authorization = `Bearer ${token}`;
        }

        return requestConfig;
    },
    error => Promise.reject(error)
);

api.interceptors.response.use(
    response => response,
    async error => {
        const requestConfig = error.config as RetryableRequestConfig | undefined;
        const requestUrl = requestConfig?.url || '';
        const shouldTryRefresh =
            error.response?.status === 401 &&
            requestConfig &&
            !requestConfig._retry &&
            !AUTH_EXCLUDED_PATHS.some(path => requestUrl.includes(path));

        if (shouldTryRefresh) {
            requestConfig._retry = true;
            const nextToken = await auth.refreshAccessToken();
            if (nextToken) {
                requestConfig.headers = requestConfig.headers || {};
                requestConfig.headers.Authorization = `Bearer ${nextToken}`;
                return api(requestConfig);
            }
        }

        try {
            await auth.clearTokens();
        } catch {} // ignore
        return Promise.reject(error);
    }
);

const checkConnection = async () => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
}

const getResponseData = <T>(response: { data?: { data?: T } & T }): T => {
    const payload = response.data;
    if (payload && typeof payload === 'object' && 'data' in payload) {
        return payload.data as T;
    }
    return payload as T;
};

export const getApiErrorMessage = (error: unknown, fallback = 'Une erreur est survenue.'): string => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        if (axiosError.code === 'ECONNABORTED') {
            return 'La requete a pris trop de temps. Veuillez reessayer.';
        }

        if (!axiosError.response) {
            return 'Impossible de contacter le serveur. Verifiez votre connexion.';
        }

        const apiMessage = axiosError.response.data?.message;
        if (typeof apiMessage === 'string' && apiMessage.trim()) {
            return apiMessage;
        }
    }

    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return fallback;
};

// const mockOrders: Order[] = [
//     {
//         id: 'o1',
//         restaurantId: 'r1',
//         restaurantName: 'Bistro Parisien',
//         items: [
//             {
//                 dish: mockMenus['r1'][0],
//                 quantity: 2,
//             },
//             { dish: mockMenus['r1'][3], quantity: 1 },
//         ],
//         total: 35.00,
//         deliveryFee: 3.50,
//         status: 'delivered',
//         createdAt: new Date(Date.now() - 86400 * 1000),
//         estimatedDeliveryTime: new Date(Date.now() - 3600 * 1000),
//         deliveryAddress: '15 avenue des Champs-Élysées, Paris, France',
//         driverInfo: {
//             name: 'Jean Dupont',
//             phone: '+33 6 12 34 56 78',
//             photo: 'https://randomuser.me/api/portraits/men/32.jpg',
//         },
//     },
//     {
//         id: 'o2',
//         restaurantId: 'r2',
//         restaurantName: 'Tokyo Roll',
//         items: [
//             {
//                 dish: mockMenus['r2'][0],
//                 quantity: 1,
//             },
//             { dish: mockMenus['r2'][4], quantity: 1 },
//         ],
//         total: 26.00,
//         deliveryFee: 3.50,
//         status: 'on-the-way',
//         createdAt: new Date(Date.now() - 7200 * 1000),
//         estimatedDeliveryTime: new Date(Date.now() + 1800 * 1000),
//         deliveryAddress: '15 avenue des Champs-Élysées, Paris, France',
//         driverInfo: {
//             name: 'Sophie Martin',
//             phone: '+33 6 87 65 43 21',
//             photo: 'https://randomuser.me/api/portraits/women/44.jpg',
//         },
//     }
// ];

// APIs
export const restaurantAPI = {

    async getRestaurants(filters?: SearchFilters): Promise<Restaurant[]> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            log.warn('Offline: restaurants API is unavailable');
            throw new Error('No network connection');
        }

        try {
            const response = await api.get('/restaurants', { params: filters});
            // API returns { success, data: [...], pagination: {...} }
            const restaurants = response.data?.data || [];
            await cache.set('restaurants', restaurants);
            return restaurants;
        } catch (error) {
            log.error('Failed to fetch restaurants', error);
            throw error;
        }
    },
    async searchRestaurants(query: string): Promise<Restaurant[]> {
        try {
            const response = await api.get('/restaurants/search', { params: { q: query } });
            return getResponseData<Restaurant[]>(response) || [];
        } catch (error) {
            log.error('Failed to search restaurants', error);
            return [];
        }
    },
    async getRestaurantById(id: string): Promise<Restaurant | null> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            const cached = await cache.get<Restaurant>(`restaurant_${id}`);
            return cached || null;
        }

        try {
            const response = await api.get(`/restaurants/${id}`);
            const restaurant = getResponseData<Restaurant | null>(response) || null;
            if (restaurant) {
                await cache.set(`restaurant_${id}`, restaurant);
            }
            return restaurant;
        } catch (error) {
            log.error(`Failed to fetch restaurant ${id}`, error);
            const cached = await cache.get<Restaurant>(`restaurant_${id}`);
            return cached || null;
        }
    },
    async getMenu(restaurantId: string): Promise<Dish[]> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            const cached = await cache.get<Dish[]>(`menu_${restaurantId}`);
            return cached || [];
        }

        try {
            const response = await api.get(`/restaurants/${restaurantId}/menu`);
            const menuData = getResponseData<Array<{ items?: Dish[] }>>(response) || [];
            const dishes = menuData.reduce((acc: Dish[], category) => {
                if (category.items && Array.isArray(category.items)) {
                    acc.push(...category.items);
                }
                return acc;
            }, []);
            await cache.set(`menu_${restaurantId}`, dishes);
            return dishes;
        } catch (error) {
            log.error(`Failed to fetch menu for restaurant ${restaurantId}`, error);
            const cached = await cache.get<Dish[]>(`menu_${restaurantId}`);
            return cached || [];
        }
    }
}

export const orderAPI = {
    async getOrders(): Promise<Order[]> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            const cached = await cache.get<Order[]>('orders');
            return cached && cached.length > 0 ? cached : [];
        }

        try {
            const response = await api.get('/orders');
            const orders = getResponseData<Order[]>(response) || [];
            await cache.set('orders', orders);
            return orders;
        } catch (error) {
            // log.error('Failed to fetch orders', error);
            const cached = await cache.get<Order[]>('orders');
            return cached && cached.length > 0 ? cached : [];
        }
    },
    async getOrderById(id: string): Promise<Order | null> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            const cached = await cache.get<Order>(`order_${id}`);
            return cached || null;
        }

        try {
            const response = await api.get(`/orders/${id}`);
            const order = getResponseData<Order | null>(response) || null;
            if (order) {
                await cache.set(`order_${id}`, order);
            }
            return order;
        } catch (error) {
            // log.error(`Failed to fetch order ${id}`, error);
            return (await cache.get<Order>(`order_${id}`)) || null;
        }
    },
    async syncOfflineOrders(): Promise<{ synced: number; failed: number }> {
        const offlineOrders = await storage.getItem<Order[]>(STORAGE_KEYS.OFFLINE_ORDERS);
        if (!offlineOrders || offlineOrders.length === 0) {
            return { synced: 0, failed: 0 };
        }

        try {
            const response = await api.post('/sync/orders', { offlineOrders });
            const result = getResponseData<{
                synced: number;
                failed: number;
                failedOrders?: Array<{ id?: string }>;
            }>(response);

            const failedIds = new Set((result.failedOrders || []).map(order => order.id).filter(Boolean));
            const remainingOrders = failedIds.size > 0
                ? offlineOrders.filter(order => failedIds.has(order.id))
                : [];

            if (remainingOrders.length > 0) {
                await storage.setItem(STORAGE_KEYS.OFFLINE_ORDERS, remainingOrders);
            } else {
                await storage.removeItem(STORAGE_KEYS.OFFLINE_ORDERS);
            }

            return {
                synced: result.synced || 0,
                failed: result.failed || 0,
            };
        } catch (error) {
            log.error('Failed to sync offline orders', error);
            throw error;
        }
    },
}

export const uploadAPI = {
    async uploadImage(uri: string, type: 'profile' | 'review'): Promise<string> {
        try {
            const formData = new FormData();
            formData.append('image', {
                uri,
                name: `${type}_${Date.now()}.jpg`,
                type: 'image/jpeg',
            } as any);

            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data?.url || response.data?.data?.url;

        } catch (error) {
            log.error('Failed to upload image', error);
            throw error;
        }
    }
}

export default api ;
