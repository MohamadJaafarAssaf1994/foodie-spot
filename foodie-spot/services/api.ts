import { cache } from '@/services/cache';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';

import { storage } from '@/services/storage';
import { Dish, Restaurant, SearchFilters } from '@/types';




const api = axios.create({
    baseURL: 'https://api.example.com',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(
    async requestConfig => {
        const token = await storage.getItem('token');
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
        if (error.response && error.response.status === 401) {
            await storage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

const checkConnection = async () => {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
}



// Mock data for testing
const mockRestaurants: Restaurant[] = [
    {
        id: 'r1',
        name: 'Bistro Parisien',
        cuisine: 'Française',
        description: 'Cuisine bistronomique et produit frais',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        rating: 4.8,
        reviewsCount: 320,
        deliveryTime: 30,
        distance: 1.2,
        priceRange: '€€€',
        address: '12 rue de Rivoli, Paris, France',
        phone: '+33 1 23 45 67 89',
        coordinates: {
            latitude: 48.8566,
            longitude: 2.3522,
        },
        isOpen: true,
        isFavorite: false,
    },
    {
        id: 'r2',
        name: 'Tokyo Roll',
        cuisine: 'Sushi',
        description: 'Sushi rools, poke bowls et specialités japonaises',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        rating: 4.8,
        reviewsCount: 320,
        deliveryTime: 30,
        distance: 1.2,
        priceRange: '€€€',
        address: '12 rue de Rivoli, Paris, France',
        phone: '+33 1 23 45 67 89',
        coordinates: {
            latitude: 48.8566,
            longitude: 2.3522,
        },
        isOpen: true,
        isFavorite: false,
    }

];

const mockMenus: Record<string, Dish[]> = {
    r1: [
        {
            id: 'd1',
            resurantId: 'r1',
            name: 'Boeuf Bourguignon',
            description: 'Boeuf mijoté au vin rouge avec légumes de saison',
            price : 18.50,
            image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            category: 'Plats',
            isAvailable: true,
        },
        {
            id: 'd2',
            resurantId: 'r1',
            name: 'Tarte Tatin',
            description: 'Tarte aux pommes caramélisées, servie tiède',
            price : 7.00,
            image: 'https://images.unsplash.com/photo-1475856034132-47f1b0752b30?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            category: 'Desserts',
            isAvailable: true,
        }
    ],
    r2: [
         {
            id: 'd3',
            resurantId: 'r2',
            name: 'California Roll',
            description: 'Rouleau de sushi avec crabe, avocat et concombre',
            price : 12.00,
            image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb36?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            category: 'Sushi',
            isAvailable: true,
         },
         {
            id: 'd4',
            resurantId: 'r2',
            name: 'Poke Bowl Saumon',
            description: 'Bol de riz avec saumon mariné, légumes frais et sauce soja',
            price : 14.00,
            image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb36?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
            category: 'Poke Bowls',
            isAvailable: true,
         }
    ]
}

// APIs
export const restaurantAPI = {

    async getRestaurants(filters?: SearchFilters): Promise<Restaurant[]> {

        const isConnected = await checkConnection();

        if (!isConnected) {
            // log.warn('Offline: Loading cached restaurants');
            const cached = await cache.get<Restaurant[]>('restaurants');
            return cached && cached.length > 0 ? cached : mockRestaurants;
        }

        try {
            const response = await api.get('/restaurants', { params: filters });
            const restaurants = response.data?.length ? response.data : mockRestaurants;
            await cache.set('restaurants', restaurants);
            return restaurants;
        } catch (error) {
            // log.error('Failed to fetch restaurants', error);
            const cached = await cache.get<Restaurant[]>('restaurants');
            return cached && cached.length > 0 ? cached : mockRestaurants;
        }
    },
    async searchRestaurants(query: string): Promise<Restaurant[]> {
        try {

            const filteredRestaurants = mockRestaurants.filter(restaurant => restaurant.name.toLowerCase().includes(query.toLowerCase()));
            return filteredRestaurants;

            // const response = await api.get('/restaurants/search', { params: { q: query } });
            // return response.data;
        } catch (error) {
            // log.error('Failed to search restaurants', error);
            return [];
        }

    },
    async getRestaurantById(id: string): Promise<Restaurant | null> {
        const isConnected = await checkConnection();

        if (!isConnected) {
            const cached = await cache.get<Restaurant>(`restaurant_${id}`);
            return cached;
        }

        try {
            const response = await api.get(`/restaurants/${id}`);
            const restaurant = response.data || mockRestaurants.find(r => r.id === id);
            if (restaurant) {
                await cache.set(`restaurant_${id}`, restaurant);
            }
            return restaurant || null;

        } catch (error) {
            // log.error(`Failed to fetch restaurant ${id}`, error);
            return (await cache.get<Restaurant>(`restaurant_${id}`)) || mockRestaurants.find(r => r.id === id) || null;
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
            const menu = response.data?.length ? response.data : mockMenus[restaurantId] || [];
            await cache.set(`menu_${restaurantId}`, menu);
            return menu;
        } catch (error) {
            // log.error(`Failed to fetch menu for restaurant ${restaurantId}`, error);
            const cached = await cache.get<Dish[]>(`menu_${restaurantId}`);
            return (cached && cached.length > 0) ? cached : mockMenus[restaurantId] || [];
        }
    }
}

export const userAPI = {
    async toggleFavorite(restaurantId: string) {
    }
}