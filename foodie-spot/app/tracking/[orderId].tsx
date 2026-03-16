import React, { useMemo } from 'react';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock3, MapPin, Phone, Star, Truck } from 'lucide-react-native';

import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { AppImages } from '@/constants/assets';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { useOrderTracking } from '@/hooks/use-order-tracking';

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { t } = useI18n();
  const { tracking, loading, refreshing, error, refreshTracking, retryLoadTracking } = useOrderTracking(orderId);

  const formattedCoordinates = useMemo(() => {
    if (!tracking?.driverLocation) {
      return null;
    }

    return `${tracking.driverLocation.latitude.toFixed(4)}, ${tracking.driverLocation.longitude.toFixed(4)}`;
  }, [tracking]);

  if (loading && !tracking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingState message={t('tracking_loading')} />
      </SafeAreaView>
    );
  }

  if (!tracking) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ErrorState message={error || t('tracking_not_found')} onAction={retryLoadTracking} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshTracking} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('tracking_title')}</Text>
          <Text style={styles.subtitle}>#{tracking.orderId}</Text>
        </View>

        {error ? <ErrorState message={error} onAction={refreshTracking} /> : null}

        <View style={styles.card}>
          <Text style={styles.label}>{t('tracking_restaurant')}</Text>
          <Text style={styles.value}>{tracking.restaurant?.name || '-'}</Text>

          <Text style={styles.label}>{t('tracking_status')}</Text>
          <Text style={styles.status}>{tracking.status}</Text>

          <Text style={styles.label}>{t('tracking_delivery_address')}</Text>
          <Text style={styles.value}>{tracking.deliveryAddress}</Text>

          {tracking.estimatedArrival || tracking.estimatedDelivery ? (
            <>
              <Text style={styles.label}>{t('tracking_estimated_arrival')}</Text>
              <View style={styles.inlineRow}>
                <Clock3 size={16} color={Colors.light.primary} />
                <Text style={styles.value}>
                  {new Date(tracking.estimatedArrival || tracking.estimatedDelivery || '').toLocaleTimeString()}
                  {tracking.estimatedMinutes ? ` • ${tracking.estimatedMinutes} min` : ''}
                </Text>
              </View>
            </>
          ) : null}
        </View>

        {tracking.driver ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('tracking_driver')}</Text>
            <View style={styles.driverRow}>
              <Image
                source={tracking.driver.photo ? { uri: tracking.driver.photo } : AppImages.imagePlaceholder}
                placeholder={AppImages.imagePlaceholder}
                style={styles.driverAvatar}
                contentFit="cover"
              />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{tracking.driver.name}</Text>
                <View style={styles.inlineRow}>
                  <Phone size={14} color={Colors.light.textMuted} />
                  <Text style={styles.inlineText}>{tracking.driver.phone}</Text>
                </View>
                {tracking.driver.vehicle ? (
                  <View style={styles.inlineRow}>
                    <Truck size={14} color={Colors.light.textMuted} />
                    <Text style={styles.inlineText}>
                      {t('tracking_driver_vehicle')}: {tracking.driver.vehicle}
                    </Text>
                  </View>
                ) : null}
                {tracking.driver.rating ? (
                  <View style={styles.inlineRow}>
                    <Star size={14} color={Colors.light.warning} />
                    <Text style={styles.inlineText}>
                      {t('tracking_driver_rating')}: {tracking.driver.rating}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        {formattedCoordinates ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('tracking_location')}</Text>
            <View style={styles.mapPlaceholder}>
              <MapPin size={18} color={Colors.light.primary} />
              <Text style={styles.mapCoordinates}>{formattedCoordinates}</Text>
            </View>
            <Text style={styles.mapHint}>{t('tracking_map_hint')}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('tracking_timeline')}</Text>
          {tracking.timeline.map(entry => (
            <View key={`${entry.status}-${entry.timestamp}`} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineMessage}>{entry.message}</Text>
                <Text style={styles.timelineMeta}>
                  {entry.status} • {new Date(entry.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
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
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    color: Colors.light.textMuted,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: Colors.light.textSubtle,
    marginTop: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  status: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  inlineText: {
    color: Colors.light.text,
  },
  driverRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  driverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  driverInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  mapPlaceholder: {
    minHeight: 120,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  mapCoordinates: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  mapHint: {
    color: Colors.light.textMuted,
    fontSize: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.light.primary,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  timelineMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  timelineMeta: {
    marginTop: 4,
    color: Colors.light.textMuted,
    fontSize: 12,
  },
});
