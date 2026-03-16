// services/auth.ts

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from './api';
import log from './logger';
import { storage, STORAGE_KEYS } from './storage';
import { cache } from './cache';
import { getApiErrorMessage, getApiErrorStatus } from './api-utils';

// ============================================
// Types
// ============================================
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  avatar?: string;
  photo?: string;
  addresses: Address[];
  favoriteRestaurants: string[];
  notificationsEnabled?: boolean;
  createdAt?: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  apartment?: string;
  city: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  instructions?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}



// ============================================
// Auth Service
// ============================================
class AuthService {
  private secureStoreAvailable: boolean | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  private normalizeUser(user: Partial<User> | null | undefined): User | null {
    if (!user || !user.id || !user.email) {
      return null;
    }

    const photo = user.photo || user.avatar;
    return {
      ...user,
      name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      phone: user.phone || '',
      photo,
      avatar: user.avatar || photo,
      addresses: user.addresses || [],
      favoriteRestaurants: user.favoriteRestaurants || [],
    } as User;
  }

  private async canUseSecureStore(): Promise<boolean> {
    if (Platform.OS === 'web') {
      this.secureStoreAvailable = false;
      return false;
    }

    if (this.secureStoreAvailable !== null) {
      return this.secureStoreAvailable;
    }

    const hasRequiredApi =
      typeof SecureStore.getItemAsync === 'function' &&
      typeof SecureStore.setItemAsync === 'function' &&
      typeof SecureStore.deleteItemAsync === 'function';

    if (!hasRequiredApi) {
      this.secureStoreAvailable = false;
      return false;
    }

    if (typeof SecureStore.isAvailableAsync === 'function') {
      try {
        this.secureStoreAvailable = await SecureStore.isAvailableAsync();
        return this.secureStoreAvailable;
      } catch {
        this.secureStoreAvailable = false;
        return false;
      }
    }

    this.secureStoreAvailable = true;
    return true;
  }

  private async getStoredValue(key: string): Promise<string | null> {
    const useSecureStore = await this.canUseSecureStore();
    if (useSecureStore) {
      return SecureStore.getItemAsync(key);
    }
    return storage.getItem<string>(key);
  }

  private async setStoredValue(key: string, value: string): Promise<void> {
    const useSecureStore = await this.canUseSecureStore();
    if (useSecureStore) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    await storage.setItem(key, value);
  }

  private async deleteStoredValue(key: string): Promise<void> {
    const useSecureStore = await this.canUseSecureStore();
    if (useSecureStore) {
      await SecureStore.deleteItemAsync(key);
      return;
    }
    await storage.removeItem(key);
  }

  async getAccessToken(): Promise<string | null> {
    try {
      return await this.getStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      log.error('Failed to get access token:', error);
      return null;
    }
  }

  async setAccessToken(token: string): Promise<void> {
    try {
      await this.setStoredValue(STORAGE_KEYS.ACCESS_TOKEN, token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } catch (error) {
      log.error('Failed to set access token:', error);
      throw error;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await this.getStoredValue(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      log.error('Failed to get refresh token:', error);
      return null;
    }
  }

  async setRefreshToken(token: string): Promise<void> {
    try {
      await this.setStoredValue(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      log.error('Failed to set refresh token:', error);
      throw error;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await this.deleteStoredValue(STORAGE_KEYS.ACCESS_TOKEN);
      await this.deleteStoredValue(STORAGE_KEYS.REFRESH_TOKEN);
      await this.deleteStoredValue(STORAGE_KEYS.USER);
      await this.deleteStoredValue(STORAGE_KEYS.AUTH_TOKEN);
      delete api.defaults.headers.common.Authorization;
    } catch (error) {
      log.error('Failed to clear tokens:', error);
    }
  }

  async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const refreshToken = await this.getRefreshToken();
        if (!refreshToken) {
          return null;
        }

        const response = await api.post('/auth/refresh', { refreshToken });
        const data = response.data?.data || response.data;
        const nextAccessToken = data?.accessToken;

        if (!nextAccessToken) {
          throw new Error('Refresh token response missing access token');
        }

        await this.setAccessToken(nextAccessToken);
        return nextAccessToken;
      } catch (error) {
        log.error('Failed to refresh access token:', error);
        await this.clearTokens();
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const userJson = await this.getStoredValue(STORAGE_KEYS.USER);
      if (typeof userJson === 'string' && userJson) {
        return this.normalizeUser(JSON.parse(userJson));
      }
      if (userJson && typeof userJson === 'object') {
        return this.normalizeUser(userJson as unknown as User);
      }
      return null;
    } catch (error) {
      log.error('Failed to get stored user:', error);
      return null;
    }
  }

  async setStoredUser(user: User): Promise<void> {
    try {
      await this.setStoredValue(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      log.error('Failed to set stored user:', error);
      throw error;
    }
  }

  async getAuthState(): Promise<AuthState> {
    try {
      const [token, user] = await Promise.all([
        this.getAccessToken(),
        this.getStoredUser(),
      ]);
      const isAuthenticated = !!token && !!user;
      return { user: isAuthenticated ? user : null, isAuthenticated };
    } catch (error) {
      log.error('Failed to get auth state:', error);
      return { user: null, isAuthenticated: false };
    }
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      log.info('🔐 [Auth] Attempting login for:', credentials.email);

      const response = await api.post('/auth/login', credentials);
      const data = response.data.data || response.data;

      const user = this.normalizeUser(data.user);
      if (!user) {
        throw new Error('Réponse utilisateur invalide');
      }

      const tokens: AuthTokens = {
        accessToken: data.accessToken || data.token,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn || 3600,
      };

      await this.setAccessToken(tokens.accessToken);
      if (tokens.refreshToken) {
        await this.setRefreshToken(tokens.refreshToken);
      }
      await this.setStoredUser(user);

      log.info('✅ [Auth] Login successful for:', user.email);
      log.debug('Received tokens:', tokens);
      return { user, tokens };
    } catch (error: unknown) {
      log.error('❌ [Auth] Login failed:', error);
      if (getApiErrorStatus(error) === 401) {
        throw new Error('Email ou mot de passe incorrect');
      }
      throw new Error(getApiErrorMessage(error, 'Erreur de connexion. Veuillez reessayer.'));
    }
  }

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    try {
      log.info('📝 [Auth] Attempting registration for:', data.email);

      const response = await api.post('/auth/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || '',
      });

      const resData = response.data.data || response.data;

      const user = this.normalizeUser(resData.user);
      if (!user) {
        throw new Error('Réponse utilisateur invalide');
      }

      const tokens: AuthTokens = {
        accessToken: resData.accessToken || resData.token,
        refreshToken: resData.refreshToken,
        expiresIn: resData.expiresIn || 3600,
      };

      await this.setAccessToken(tokens.accessToken);
      if (tokens.refreshToken) {
        await this.setRefreshToken(tokens.refreshToken);
      }
      await this.setStoredUser(user);

      log.info('✅ [Auth] Registration successful for:', user.email);
      return { user, tokens };
    } catch (error: unknown) {
      log.error('❌ [Auth] Registration failed:', error);
      if (getApiErrorStatus(error) === 409) {
        throw new Error('Cet email est déjà utilisé');
      }
      throw new Error(getApiErrorMessage(error, 'Erreur lors de l\'inscription. Veuillez reessayer.'));
    }
  }

  async logout(): Promise<void> {
    try {
      log.info('🚪 [Auth] Logging out...');
      try {
        await api.post('/auth/logout');
      } catch (error) {
        // Ignorer les erreurs de l'API logout
        log.warn('⚠️ [Auth] Logout API call failed (ignoring):', error);
      }
      await this.clearTokens();
      cache.clearAll();
      
      log.info('✅ [Auth] Logout successful');
    } catch (error) {
      log.error('❌ [Auth] Logout error:', error);
      await this.clearTokens();
    } finally {
      this.refreshPromise = null;
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await api.patch('/user/profile', updates);
      const user = this.normalizeUser(response.data.data || response.data);
      const currentUser = await this.getStoredUser();
      const updatedUser = this.normalizeUser({ ...currentUser, ...user });
      if (!updatedUser) {
        throw new Error('Profil mis à jour invalide');
      }
      await this.setStoredUser(updatedUser);
      return updatedUser;
    } catch (error) {
      log.error('Failed to update profile:', error);
      throw new Error(getApiErrorMessage(error, 'Impossible de mettre a jour le profil.'));
    }
  }

  async toggleFavoriteRestaurant(restaurantId: string): Promise<string[]> {
    try {
      const currentUser = await this.getStoredUser();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifie');
      }

      const currentFavorites = currentUser.favoriteRestaurants || [];
      const isFavorite = currentFavorites.includes(restaurantId);

      if (isFavorite) {
        await api.delete(`/favorites/${restaurantId}`);
      } else {
        await api.post('/favorites', { restaurantId });
      }

      const nextFavorites = isFavorite
        ? currentFavorites.filter(id => id !== restaurantId)
        : [...currentFavorites, restaurantId];

      await this.setStoredUser({
        ...currentUser,
        favoriteRestaurants: nextFavorites,
      });

      return nextFavorites;
    } catch (error) {
      log.error('Failed to toggle favorite restaurant:', error);
      throw new Error(getApiErrorMessage(error, 'Impossible de mettre a jour les favoris.'));
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return this.getStoredUser();
  }
}

export const auth = new AuthService();
export default auth;
