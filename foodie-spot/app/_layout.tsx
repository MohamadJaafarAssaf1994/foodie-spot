// app/_layout.tsx

import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { I18nProvider } from '@/contexts/i18n-context';
import { ThemeProvider, useAppTheme } from '@/contexts/theme-context';
import { ToastProvider } from '@/components/toast-provider';
import { useOffline } from '@/hooks/use-offline';
import { storage, STORAGE_KEYS } from '@/services/storage';
import log from '@/services/logger';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutContent() {
  const { colorScheme, colors } = useAppTheme();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOffline();
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const lastRedirectRef = useRef<string | null>(null);
  const [isOnboardingLoading, setIsOnboardingLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const normalizedPath = useMemo(() => pathname.replace(/\/+$/, '') || '/', [pathname]);
  const isOnboardingRoute = normalizedPath === '/onboarding';
  const isAuthRoute = useMemo(
    () =>
      normalizedPath === '/(auth)' ||
      normalizedPath.startsWith('/(auth)/') ||
      normalizedPath === '/login' ||
      normalizedPath === '/register',
    [normalizedPath]
  );
  const isProtectedRoute = useMemo(
    () =>
      normalizedPath === '/' ||
      normalizedPath.startsWith('/(tabs)') ||
      normalizedPath === '/search' ||
      normalizedPath === '/orders' ||
      normalizedPath === '/profile' ||
      normalizedPath === '/notifications' ||
      normalizedPath === '/favorites' ||
      normalizedPath === '/cart' ||
      normalizedPath === '/checkout' ||
      normalizedPath.startsWith('/restaurant/') ||
      normalizedPath.startsWith('/order/') ||
      normalizedPath.startsWith('/dish/') ||
      normalizedPath.startsWith('/tracking/') ||
      normalizedPath.startsWith('/review/'),
    [normalizedPath]
  );

  useEffect(() => {
    const loadOnboardingFlag = async () => {
      const seen = await storage.getItem<boolean>(STORAGE_KEYS.ONBOARDING_SEEN);
      setHasSeenOnboarding(Boolean(seen));
      setIsOnboardingLoading(false);
    };

    void loadOnboardingFlag();
  }, []);

  // Navigation Guard
  useEffect(() => {
    if (isLoading || isOnboardingLoading || !normalizedPath) {
      return;
    }

    let isCancelled = false;

    const runGuard = async () => {
      let nextHasSeenOnboarding = hasSeenOnboarding;

      // Re-check persisted onboarding state before redirecting away from auth/app routes.
      // This avoids a stale in-memory flag sending users back to the first slide right after completion.
      if (!nextHasSeenOnboarding && !isOnboardingRoute) {
        const persistedSeen = await storage.getItem<boolean>(STORAGE_KEYS.ONBOARDING_SEEN);
        if (persistedSeen) {
          nextHasSeenOnboarding = true;
          if (!isCancelled) {
            setHasSeenOnboarding(true);
          }
        }
      }

      if (isCancelled) {
        return;
      }

      let redirectTarget: '/login' | '/' | '/onboarding' | null = null;

      if (!nextHasSeenOnboarding && !isOnboardingRoute) {
        redirectTarget = '/onboarding';
      } else if (nextHasSeenOnboarding && isOnboardingRoute) {
        redirectTarget = isAuthenticated ? '/' : '/login';
      } else if (!isAuthenticated && isProtectedRoute) {
        redirectTarget = '/login';
      } else if (isAuthenticated && isAuthRoute) {
        redirectTarget = '/';
      }

      log.debug('🛡️ [NavigationGuard]', {
        pathname: normalizedPath,
        isAuthenticated,
        isProtectedRoute,
        isAuthRoute,
        isOnboardingRoute,
        hasSeenOnboarding: nextHasSeenOnboarding,
        redirectTarget,
      });

      if (!redirectTarget) {
        lastRedirectRef.current = null;
        return;
      }

      if (normalizedPath === redirectTarget || lastRedirectRef.current === redirectTarget) {
        return;
      }

      lastRedirectRef.current = redirectTarget;
      router.replace(redirectTarget);
    };

    void runGuard();

    return () => {
      isCancelled = true;
    };
  }, [normalizedPath, isLoading, isOnboardingLoading, hasSeenOnboarding, isAuthenticated, isProtectedRoute, isAuthRoute, isOnboardingRoute, router]);

  if (isLoading || isOnboardingLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingLogo}>🍔</Text>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Chargement...</Text>
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.bannerText}>
            Hors ligne {pendingCount > 0 && `• ${pendingCount} en attente`}
          </Text>
        </View>
      )}

      {isOnline && pendingCount > 0 && (
        <TouchableOpacity style={styles.syncBanner} onPress={syncNow} disabled={isSyncing}>
          <Ionicons name={isSyncing ? 'sync' : 'sync-outline'} size={16} color="#fff" />
          <Text style={styles.bannerText}>
            {isSyncing ? 'Synchronisation...' : `Synchroniser ${pendingCount} action(s)`}
          </Text>
        </TouchableOpacity>
      )}

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="restaurant/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="order/[orderId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dish/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="cart" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="checkout" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="tracking/[orderId]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="review/[orderId]" options={{ presentation: 'modal' }} />
      </Stack>

      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingLogo: { fontSize: 64, marginBottom: 16 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  offlineBanner: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingTop: 50, gap: 8 },
  syncBanner: { backgroundColor: '#F59E0B', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingTop: 50, gap: 8 },
  bannerText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <ThemeProvider>
            <I18nProvider>
              <AuthProvider>
                <RootLayoutContent />
              </AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
