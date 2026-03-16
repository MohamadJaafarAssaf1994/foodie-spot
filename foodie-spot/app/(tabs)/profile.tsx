import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MapPin, Heart, ShoppingBag, Phone, Share2, Camera, ChevronRight, LogOut, Moon, Sun } from 'lucide-react-native';
import { Image } from 'expo-image';

import log from '@/services/logger';
import  { useToast } from '@/components/toast-provider';
import { AppImages } from '@/constants/assets';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { ThemeMode, useAppTheme } from '@/contexts/theme-context';
import { useProfileScreen } from '@/hooks/use-profile-screen';

export default function ProfileScreen() {
  const toast = useToast();
  const { locale, setLocale, t } = useI18n();
  const { colors, mode, setMode } = useAppTheme();
  const { user, logout, isLoading, stats, favoriteRestaurants, profileError, refreshProfile, uploadProfilePhoto } = useProfileScreen();
  const displayName = user?.name || user?.email || 'Utilisateur';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('common_theme_system') },
    { value: 'light', label: t('common_theme_light') },
    { value: 'dark', label: t('common_theme_dark') },
  ];

  const handlePickImage = async () => {
    try {
      const imageUrl = await uploadProfilePhoto();
      if (imageUrl) {
        toast.success(t('profile_photo_updated'));
      }
    } catch (error) {
      log.error('Failed to upload profile photo:', error);
      Alert.alert(t('common_error'), error instanceof Error ? error.message : t('profile_photo_edit'));
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined'
        ? window.confirm(t('profile_logout_message'))
        : true;
      if (confirmed) {
        void logout();
      }
      return;
    }

    Alert.alert(t('profile_logout_title'), t('profile_logout_message'), [
      { text: t('common_cancel'), style: 'cancel' },
      {
        text: t('profile_logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  if (isLoading && !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonLineLarge} />
          <View style={styles.skeletonLineMedium} />
          <View style={styles.skeletonLineSmall} />
          <View style={styles.skeletonStatsRow}>
            <View style={styles.skeletonStat} />
            <View style={styles.skeletonStat} />
            <View style={styles.skeletonStat} />
          </View>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>{t('profile_loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.menuText}>{t('profile_no_user')}</Text>
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
                <Image
                  source={{ uri: user.photo }}
                  placeholder={AppImages.imagePlaceholder}
                  cachePolicy="memory-disk"
                  contentFit="cover"
                  transition={150}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{avatarInitial}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraButton}
                accessibilityRole="button"
                accessibilityLabel={t('profile_photo_edit')}
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
            <Text style={styles.statValue}>{stats.ordersCount}</Text>
            <Text style={styles.statLabel}>{t('profile_orders')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.favoritesCount}</Text>
            <Text style={styles.statLabel}>{t('profile_favorites')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}</Text>
            <Text style={styles.statLabel}>{t('profile_reviews')}</Text>
        </View>
      </View>

        {profileError ? (
          <TouchableOpacity style={styles.inlineNotice} onPress={() => void refreshProfile()}>
            <Text style={styles.inlineNoticeText}>{t('profile_stats_error')}</Text>
            <Text style={styles.inlineNoticeAction}>{t('common_retry')}</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.languageCard}>
          <Text style={styles.languageTitle}>{t('common_language')}</Text>
          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[styles.languageChip, locale === 'fr' && styles.languageChipActive]}
              onPress={() => void setLocale('fr')}
            >
              <Text style={[styles.languageChipText, locale === 'fr' && styles.languageChipTextActive]}>{t('common_french')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageChip, locale === 'en' && styles.languageChipActive]}
              onPress={() => void setLocale('en')}
            >
              <Text style={[styles.languageChipText, locale === 'en' && styles.languageChipTextActive]}>{t('common_english')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.languageCard}>
          <View style={styles.themeHeader}>
            <Text style={styles.languageTitle}>{t('common_theme')}</Text>
            {mode === 'dark' ? <Moon size={18} color={colors.primary} /> : <Sun size={18} color={colors.primary} />}
          </View>
          <View style={styles.languageRow}>
            {themeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.languageChip, mode === option.value && styles.languageChipActive]}
                onPress={() => void setMode(option.value)}
              >
                <Text style={[styles.languageChipText, mode === option.value && styles.languageChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} accessibilityRole="button">
            <MapPin size={20} color={colors.textMuted} />
            <Text style={styles.menuText}>{t('profile_addresses')}</Text>
            <View style={styles.menuRight}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{user.addresses.length}</Text>
              </View>
              <ChevronRight size={18} color={colors.textSubtle} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} accessibilityRole="button" onPress={() => router.push('/(tabs)/favorites')}>
            <Heart size={20} color={colors.textMuted} />
            <Text style={styles.menuText}>{t('profile_favorites')}</Text>
            <View style={styles.menuRight}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{favoriteRestaurants.length}</Text>
              </View>
              <ChevronRight size={18} color={colors.textSubtle} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} accessibilityRole="button" onPress={() => router.push('/(tabs)/orders')}>
            <ShoppingBag size={20} color={colors.textMuted} />
            <Text style={styles.menuText}>{t('profile_history')}</Text>
            <ChevronRight size={18} color={colors.textSubtle} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} accessibilityRole="button">
            <Phone size={20} color={colors.textMuted} />
            <Text style={styles.menuText}>{t('profile_support')}</Text>
            <ChevronRight size={18} color={colors.textSubtle} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} accessibilityRole="button">
            <Share2 size={20} color={colors.textMuted} />
            <Text style={styles.menuText}>{t('profile_share_app')}</Text>
            <ChevronRight size={18} color={colors.textSubtle} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <LogOut size={20} color={colors.primary} />
            <Text style={[styles.menuText, styles.logoutText]}>{t('profile_logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: colors.textMuted,
  },
  skeletonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  skeletonAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceMuted,
  },
  skeletonLineLarge: {
    width: 180,
    height: 18,
    borderRadius: Radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  skeletonLineMedium: {
    width: 220,
    height: 14,
    borderRadius: Radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  skeletonLineSmall: {
    width: 140,
    height: 14,
    borderRadius: Radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  skeletonStat: {
    width: 88,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: colors.surfaceMuted,
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
    backgroundColor: colors.primary,
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
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 2,
  },
  phone: {
    fontSize: 12,
    color: colors.textSubtle,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  inlineNotice: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    marginTop: -Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: Radius.md,
    gap: Spacing.md,
  },
  inlineNoticeText: {
    flex: 1,
    color: colors.textMuted,
  },
  inlineNoticeAction: {
    color: colors.primary,
    fontWeight: '700',
  },
  languageCard: {
    backgroundColor: colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  languageChip: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  languageChipActive: {
    backgroundColor: colors.primary,
  },
  languageChipText: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  languageChipTextActive: {
    color: '#fff',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: colors.text,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
