import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MapPin, Heart, ShoppingBag, Phone, Share2, Camera, ChevronRight, LogOut } from 'lucide-react-native';

import log from '@/services/logger';
import  { useToast } from '@/components/toast-provider';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useProfileScreen } from '@/hooks/use-profile-screen';

export default function ProfileScreen() {

  const toast = useToast();
  const { user, logout, isLoading, uploadProfilePhoto } = useProfileScreen();
  const displayName = user?.name || user?.email || 'Utilisateur';
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const handlePickImage = async () => {
    try {
      const imageUrl = await uploadProfilePhoto();
      if (imageUrl) {
        toast.success('Photo de profil mise à jour !');
      }
    } catch (error) {
      log.error('Failed to upload profile photo:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de télécharger la photo');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')
        : true;
      if (confirmed) {
        void logout();
      }
      return;
    }

    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (isLoading && !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Aucun utilisateur connecté.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{avatarInitial}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraButton}
                accessibilityRole="button"
                accessibilityLabel="Modifier la photo de profil"
                hitSlop={8}
                onPress={handlePickImage}
              >
                <Camera size={14} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.phone}>{user.phone}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Commandes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.favoriteRestaurants?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Favoris</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Avis</Text>
          </View>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} accessibilityRole="button">
            <MapPin size={20} color="#666" />
            <Text style={styles.menuText}>Mes adresses</Text>
            <View style={styles.menuRight}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{user.addresses.length}</Text>
              </View>
              <ChevronRight size={18} color="#ccc" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <Heart size={20} color="#666" />
            <Text style={styles.menuText}>Mes favoris</Text>
            <View style={styles.menuRight}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{user.favoriteRestaurants.length}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.menuItem} accessibilityRole="button" onPress={() => router.push('/(tabs)/orders')}>
            <ShoppingBag size={20} color="#666" />
            <Text style={styles.menuText}>Historique</Text>
            <ChevronRight size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} accessibilityRole="button">
            <Phone size={20} color="#666" />
            <Text style={styles.menuText}>Support</Text>
            <ChevronRight size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} accessibilityRole="button">
            <Share2 size={20} color="#666" />
            <Text style={styles.menuText}>Partager l&apos;app</Text>
            <ChevronRight size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <LogOut size={20} color="#FF6B35" />
            <Text style={[styles.menuText, styles.logoutText]}>Déconnexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: Colors.light.textMuted,
    marginBottom: 2,
  },
  phone: {
    fontSize: 12,
    color: Colors.light.textSubtle,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceMuted,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.light.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textMuted,
  },
  menu: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: Colors.light.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.light.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
