import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import * as ImagePicker from 'expo-image-picker';

import { profileAPI, uploadAPI } from '@/services/api';
import type { User } from '@/services/auth';
import { useAuth } from '@/contexts/auth-context';
import { ProfileStats, Restaurant } from '@/types';

const emptyStats: ProfileStats = {
  ordersCount: 0,
  favoritesCount: 0,
  reviewsCount: 0,
  averageRating: 0,
};

export function useProfileScreen() {
  const { user, logout, updateUser, isLoading } = useAuth();
  const [profile, setProfile] = useState<User | null>(user);
  const [stats, setStats] = useState<ProfileStats>(emptyStats);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<Restaurant[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfileData = useCallback(async () => {
    try {
      setProfileError(null);
      setIsRefreshing(true);

      const [nextProfile, nextStats, nextFavorites] = await Promise.all([
        profileAPI.getProfile(),
        profileAPI.getProfileStats(),
        profileAPI.getFavoriteRestaurants(),
      ]);

      setProfile(nextProfile || user);
      setStats({
        ordersCount: nextStats.ordersCount,
        favoritesCount: nextFavorites.length || nextStats.favoritesCount,
        reviewsCount: nextStats.reviewsCount,
        averageRating: nextStats.averageRating,
      });
      setFavoriteRestaurants(nextFavorites);
    } catch {
      setProfile(nextProfile => nextProfile || user);
      setProfileError('Impossible de charger le profil.');
    } finally {
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    setProfile(user);
  }, [user]);

  useEffect(() => {
    void loadProfileData();
  }, [loadProfileData]);

  useFocusEffect(
    useCallback(() => {
      void loadProfileData();
    }, [loadProfileData])
  );

  const uploadProfilePhoto = useCallback(async () => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error(
        canAskAgain
          ? "Nous avons besoin d'acceder a vos photos pour choisir une image de profil."
          : "Accès aux photos refusé. Activez-le dans les réglages pour modifier votre photo de profil."
      );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos', 'livePhotos'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    const imageUrl = await uploadAPI.uploadImage(result.assets[0].uri, 'profile');
    await updateUser({ photo: imageUrl });
    await loadProfileData();
    return imageUrl;
  }, [loadProfileData, updateUser]);

  const displayUser = useMemo(() => profile || user, [profile, user]);

  return {
    user: displayUser,
    stats,
    favoriteRestaurants,
    logout,
    isLoading: isLoading || (isRefreshing && !displayUser),
    isRefreshing,
    profileError,
    refreshProfile: loadProfileData,
    uploadProfilePhoto,
  };
}

export default useProfileScreen;
