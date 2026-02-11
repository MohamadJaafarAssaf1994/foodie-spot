export interface Restaurant {
    id: string;
    name: string;
    cuisine: string;
    description: string;
    image: string;
    rating: number;
    reviewsCount: number;
    deliveryTime: number;
    distance: number;
    priceRange: string;
    address: string;
    phone: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    isOpen: boolean;
    isFavorite: boolean;
}

export interface SearchFilters {
    cuisine?: string;
    priceRange?: string;
    rating?: number;
    deliveryTime?: number;
    isOpen?: boolean;
}
export interface Dish {
    id: string;
    resurantId: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    allergens?: string[];
    isAvailable: boolean;
}