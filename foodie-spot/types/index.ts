export interface DeliveryTimeRange {
    min: number;
    max: number;
}

export interface Restaurant {
    id: string;
    name: string;
    cuisine: string;
    description: string;
    image: string;
    rating: number;
    reviewsCount: number;
    deliveryTime: number | DeliveryTimeRange;
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
    lat?: number;
    lng?: number;
    radius?: number;
    sortBy?: 'distance' | 'rating' | 'deliveryTime' | 'popularity';
    search?: string;
}
export interface PromoBanner {
    code: string;
    title: string;
    discountLabel: string;
    description?: string;
}
export interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    image?: string;
    restaurantCount?: number;
}
export interface Dish {
    id: string;
    restaurantId: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    allergens?: string[];
    isAvailable: boolean;
}


export interface CartItem {
    dish: Dish;
    quantity: number;
    options?: string[];
    specialInstructions?: string;
}

export interface CartTotals {
    subtotal: number;
    itemCount: number;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    photo?: string;
    addresses: Address[];
    favoriteRestaurants: string[];
}

export interface ProfileStats {
    ordersCount: number;
    favoritesCount: number;
    reviewsCount: number;
    averageRating: number;
}

export interface Address {
    id: string;
    label: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
}
export interface Order {
    id: string;
    restaurantId: string;
    restaurantName: string;
    items: CartItem[];
    total: number;
    deliveryFee: number;
    status: 'pending' | 'confirmed' | 'preparing' | 'on-the-way' | 'delivered' | 'cancelled';
    createdAt: Date;
    estimatedDeliveryTime?: Date;
    deliveryAddress: string;
    driverInfo?:{
        name: string;
        phone: string;
        photo?: string;
        location?: {
            latitude: number;
            longitude: number;
        };
    };
}

export interface OrderTimelineEntry {
    status: string;
    timestamp: string;
    message: string;
}

export interface OrderTrackingStep {
    key: string;
    label: string;
    completed: boolean;
    time?: string;
}

export interface OrderTrackingDriver {
    id: string;
    name: string;
    phone: string;
    photo?: string;
    vehicle?: string;
    rating?: number;
    totalDeliveries?: number;
}

export interface OrderTrackingLocation {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    updatedAt?: string;
}

export interface OrderTrackingData {
    orderId: string;
    orderNumber?: string;
    status: string;
    timeline: OrderTimelineEntry[];
    estimatedDelivery?: string;
    estimatedArrival?: string;
    estimatedMinutes?: number;
    restaurant: {
        id: string;
        name: string;
        image?: string;
        phone: string;
        location?: {
            latitude: number;
            longitude: number;
            address: string;
        };
    } | null;
    deliveryAddress: string;
    driver?: OrderTrackingDriver;
    driverLocation?: OrderTrackingLocation;
    steps?: OrderTrackingStep[];
}

export interface CartValidationResult {
    items: Array<{
        menuItemId: string;
        quantity: number;
        name: string;
        price: number;
        totalPrice: number;
    }>;
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    total: number;
    freeDeliveryThreshold: number;
    amountForFreeDelivery: number;
}

export interface PromoValidationResult {
    valid: boolean;
    code: string;
    type: 'percent' | 'fixed' | 'delivery';
    description?: string;
    minOrder?: number;
    maxDiscount?: number;
    discountAmount?: number;
    discountDisplay?: string;
    message?: string;
    validUntil?: string;
}

export interface RestaurantReview {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    restaurantId: string;
    orderId?: string;
    rating: number;
    qualityRating?: number | null;
    speedRating?: number | null;
    presentationRating?: number | null;
    comment: string;
    images: string[];
    likes: number;
    isVerifiedPurchase: boolean;
    createdAt: string;
}

export interface RestaurantReviewStats {
    total: number;
    average: number;
    distribution: Record<number, number>;
}

export interface RestaurantReviewsResponse {
    reviews: RestaurantReview[];
    stats: RestaurantReviewStats;
}

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

export interface ToastOptions {
    type?: ToastType;
    duration?: number;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastContextType { 
    show: (message: string,  type?: ToastType, duration?: number) => void;
    success: (message: string,  duration?: number) => void;
    error: (message: string,  duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string,  duration?: number) =>  void;
}


export interface ToastStackProps {
    toasts: ToastMessage[];
}

export interface ToastItemProps {
    toast: ToastMessage;
    index: number;
}
