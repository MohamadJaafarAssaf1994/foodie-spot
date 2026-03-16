import { cache } from '@/services/cache';
import NetInfo from '@react-native-community/netinfo';
import axios, { InternalAxiosRequestConfig } from 'axios';

import { storage, STORAGE_KEYS } from '@/services/storage';
import type { User as AuthUser } from '@/services/auth';
import { auth } from './auth'; // used to fetch token from SecureStore
import { CartValidationResult, Category, Dish, Order, OrderTrackingData, ProfileStats, PromoBanner, PromoValidationResult, Restaurant, RestaurantReviewsResponse, RestaurantReviewStats, RestaurantReview, SearchFilters } from '@/types';
import log from './logger';
import config from '@/constants/config';
import { getRemainingOfflineOrders, getResponseData } from './api-utils';


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

type ApiOrderItem = {
    quantity: number;
    menuItemId?: string;
    totalPrice?: number;
    name?: string;
    price?: number;
    menuItem?: {
        id?: string;
        name?: string;
        description?: string;
        price?: number;
        image?: string;
        category?: string;
        isAvailable?: boolean;
    };
    dish?: Dish;
};

type ApiOrder = Omit<Order, 'items' | 'deliveryAddress' | 'createdAt' | 'estimatedDeliveryTime'> & {
    items?: ApiOrderItem[];
    deliveryAddress?: string | {
        street?: string;
        city?: string;
        postalCode?: string;
        country?: string;
    };
    createdAt: string | Date;
    estimatedDeliveryTime?: string | Date;
    estimatedDelivery?: string | Date;
};

const DISH_IMAGE_FALLBACKS: Record<string, string> = {
    d12: 'https://images.unsplash.com/photo-1615361200141-f45040f367be?w=400',
    t3: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=400',
    ts1: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    gb3: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=400',
    gs1: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    gs2: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    gj1: 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=400',
    gj2: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400',
};

const AUTH_EXCLUDED_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const formatDeliveryAddress = (address: ApiOrder['deliveryAddress']): string => {
    if (typeof address === 'string') {
        return address;
    }

    if (!address) {
        return '';
    }

    return [address.street, address.city, address.postalCode, address.country]
        .filter(Boolean)
        .join(', ');
};

const normalizeOrderItem = (item: ApiOrderItem, restaurantId: string): Order['items'][number] => {
    if (item.dish) {
        return item as Order['items'][number];
    }

    const menuItem = item.menuItem;

    return {
        quantity: item.quantity,
        dish: {
            id: menuItem?.id || item.menuItemId || '',
            restaurantId,
            name: menuItem?.name || item.name || 'Item',
            description: menuItem?.description || '',
            price: menuItem?.price ?? item.price ?? 0,
            image: menuItem?.image || '',
            category: menuItem?.category || 'menu',
            isAvailable: menuItem?.isAvailable ?? true,
        },
    };
};

const normalizeOrder = (order: ApiOrder): Order => ({
    ...order,
    items: (order.items || []).map(item => normalizeOrderItem(item, order.restaurantId)),
    deliveryAddress: formatDeliveryAddress(order.deliveryAddress),
    createdAt: new Date(order.createdAt),
    estimatedDeliveryTime: order.estimatedDeliveryTime
        ? new Date(order.estimatedDeliveryTime)
        : order.estimatedDelivery
            ? new Date(order.estimatedDelivery)
            : undefined,
});

const normalizeDish = (dish: Dish, restaurantId?: string): Dish => ({
    ...dish,
    restaurantId: dish.restaurantId || restaurantId || '',
    image: dish.image || DISH_IMAGE_FALLBACKS[dish.id] || '',
});

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
        const status = error.response?.status;
        const shouldTryRefresh =
            status === 401 &&
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

        // Only clear auth state for actual authentication failures.
        // Business errors like invalid promo code (400) must not log the user out.
        if (status === 401 || status === 403) {
            try {
                await auth.clearTokens();
            } catch {} // ignore
        }

        return Promise.reject(error);
    }
);

const checkConnection = async () => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
}

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
    async searchRestaurants(query: string, filters?: Pick<SearchFilters, 'lat' | 'lng' | 'radius' | 'sortBy'>): Promise<Restaurant[]> {
        try {
            const response = await api.get('/restaurants/search', { params: { q: query, ...filters } });
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
            return (cached || []).map(dish => normalizeDish(dish, restaurantId));
        }

        try {
            const response = await api.get(`/restaurants/${restaurantId}/menu`);
            const menuData = getResponseData<Array<{ items?: Dish[] }>>(response) || [];
            const dishes = menuData.reduce((acc: Dish[], category) => {
                if (category.items && Array.isArray(category.items)) {
                    acc.push(...category.items.map(dish => normalizeDish(dish, restaurantId)));
                }
                return acc;
            }, []);
            await cache.set(`menu_${restaurantId}`, dishes);
            return dishes;
        } catch (error) {
            log.error(`Failed to fetch menu for restaurant ${restaurantId}`, error);
            const cached = await cache.get<Dish[]>(`menu_${restaurantId}`);
            return (cached || []).map(dish => normalizeDish(dish, restaurantId));
        }
    },
    async getDishById(id: string, restaurantId?: string): Promise<Dish | null> {
        try {
            const response = await api.get(`/dishes/${id}`, {
                params: restaurantId ? { restaurantId } : undefined,
            });
            const payload = getResponseData<Dish | null>(response) || null;
            const dish = payload ? normalizeDish(payload, restaurantId) : null;
            if (dish) {
                return dish;
            }
        } catch (error) {
            log.error(`Failed to fetch dish ${id}`, error);
        }

        if (restaurantId) {
            const menu = await this.getMenu(restaurantId);
            return menu.find(dish => dish.id === id) || null;
        }

        return null;
    },
}

export const categoryAPI = {
    async getCategories(): Promise<Category[]> {
        try {
            const response = await api.get('/categories');
            return getResponseData<Category[]>(response) || [];
        } catch (error) {
            log.error('Failed to fetch categories', error);
            return [];
        }
    },
};

export const homeAPI = {
    async getFeaturedPromo(): Promise<PromoBanner> {
        try {
            const response = await api.get('/promos/featured');
            return getResponseData<PromoBanner>(response);
        } catch (error) {
            log.error('Failed to fetch featured promo', error);
            return {
                code: 'FOODIE30',
                title: 'Special offer on your next order',
                discountLabel: '-30%',
            };
        }
    },
};

export const profileAPI = {
    async getProfile(): Promise<AuthUser | null> {
        try {
            const response = await api.get('/users/profile');
            return getResponseData<AuthUser | null>(response) || null;
        } catch (error) {
            log.error('Failed to fetch profile', error);
            return null;
        }
    },
    async getProfileStats(): Promise<ProfileStats> {
        try {
            const response = await api.get('/users/profile/stats');
            return getResponseData<ProfileStats>(response);
        } catch (error) {
            log.error('Failed to fetch profile stats', error);
            return {
                ordersCount: 0,
                favoritesCount: 0,
                reviewsCount: 0,
                averageRating: 0,
            };
        }
    },
    async getFavoriteRestaurants(): Promise<Restaurant[]> {
        try {
            const response = await api.get('/favorites');
            return getResponseData<Restaurant[]>(response) || [];
        } catch (error) {
            log.error('Failed to fetch favorite restaurants', error);
            return [];
        }
    },
};

export const orderAPI = {
    async getOrders(): Promise<Order[]> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            const cached = await cache.get<Order[]>('orders');
            return cached && cached.length > 0 ? cached : [];
        }

        try {
            const response = await api.get('/orders');
            const orders = (getResponseData<ApiOrder[]>(response) || []).map(normalizeOrder);
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
            const payload = getResponseData<ApiOrder | null>(response) || null;
            const order = payload ? normalizeOrder(payload) : null;
            if (order) {
                await cache.set(`order_${id}`, order);
            }
            return order;
        } catch (error) {
            // log.error(`Failed to fetch order ${id}`, error);
            return (await cache.get<Order>(`order_${id}`)) || null;
        }
    },
    async getTrackingById(id: string): Promise<OrderTrackingData | null> {
        try {
            const response = await api.get(`/orders/${id}/track`);
            return getResponseData<OrderTrackingData | null>(response) || null;
        } catch (error) {
            log.error(`Failed to fetch tracking for order ${id}`, error);
            return null;
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

            const remainingOrders = getRemainingOfflineOrders(offlineOrders, result.failedOrders);

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
    async createOrder(payload: {
        restaurantId: string;
        items: Array<{ menuItemId: string; quantity: number }>;
        deliveryAddress: string;
        paymentMethod: string;
        promoCode?: string;
        tip?: number;
        deliveryInstructions?: string;
    }): Promise<Order> {
        const response = await api.post('/orders', payload);
        return getResponseData<Order>(response);
    },
}

export const cartAPI = {
    async validateCart(payload: {
        restaurantId: string;
        items: Array<{ menuItemId: string; quantity: number }>;
    }): Promise<CartValidationResult> {
        const response = await api.post('/cart/validate', payload);
        return getResponseData<CartValidationResult>(response);
    },
};

export const promoAPI = {
    async validatePromo(payload: {
        code: string;
        subtotal: number;
        restaurantId?: string;
    }): Promise<PromoValidationResult> {
        const response = await api.post('/promos/validate', payload);
        const promo = getResponseData<{
            code: string;
            discount?: number | string;
            type: 'percent' | 'fixed' | 'delivery';
            description?: string;
            minOrder?: number;
            maxDiscount?: number;
            message?: string;
            validUntil?: string;
        }>(response);

        return {
            valid: true,
            code: promo.code,
            type: promo.type,
            description: promo.description,
            minOrder: promo.minOrder,
            maxDiscount: promo.maxDiscount,
            discountAmount: typeof promo.discount === 'number' ? promo.discount : undefined,
            discountDisplay: promo.message,
            message: promo.message,
            validUntil: promo.validUntil,
        };
    },
};

export const reviewAPI = {
    async getRestaurantReviews(restaurantId: string): Promise<RestaurantReviewsResponse> {
        const response = await api.get(`/restaurants/${restaurantId}/reviews`);
        const reviews = getResponseData<RestaurantReview[]>(response) || [];
        const stats = (response.data && typeof response.data === 'object' && 'stats' in response.data
            ? (response.data as { stats?: RestaurantReviewStats }).stats
            : undefined) || {
                total: reviews.length,
                average: reviews.length ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10 : 0,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };

        return { reviews, stats };
    },
    async createReview(payload: {
        restaurantId: string;
        orderId: string;
        rating: number;
        qualityRating?: number;
        speedRating?: number;
        presentationRating?: number;
        comment?: string;
        images?: string[];
    }) {
        return api.post('/reviews', payload);
    },
};

export const uploadAPI = {
    async uploadImage(uri: string, type: 'profile' | 'review'): Promise<string> {
        try {
            const formData = new FormData();
            const imageFile: { uri: string; name: string; type: string } = {
                uri,
                name: `${type}_${Date.now()}.jpg`,
                type: 'image/jpeg',
            };
            formData.append('image', imageFile as unknown as Blob);

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
