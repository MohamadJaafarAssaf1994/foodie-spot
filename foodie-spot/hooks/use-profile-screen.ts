import { useCallback, useEffect } from 'react';

import * as ImagePicker from 'expo-image-picker';

import { uploadAPI } from '@/services/api';
import { useAuth } from '@/contexts/auth-context';

export function useProfileScreen() {
  const { user, logout, updateUser, refreshAuth, isLoading } = useAuth();

  useEffect(() => {
    void refreshAuth();
  }, [refreshAuth]);

  const uploadProfilePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error("Nous avons besoin d'acceder a vos photos");
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
    return imageUrl;
  }, [updateUser]);

  return {
    user,
    logout,
    isLoading,
    uploadProfilePhoto,
  };
}

export default useProfileScreen;
