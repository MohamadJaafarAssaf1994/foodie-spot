import { useCallback, useEffect, useRef, useState } from 'react';

import { orderAPI } from '@/services/api';
import { notifications } from '@/services/notification';
import type { OrderTrackingData } from '@/types';

const POLLING_INTERVAL_MS = 15000;

export function useOrderTracking(orderId: string) {
  const [tracking, setTracking] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousStatusRef = useRef<string | null>(null);
  const hasSentDeliveredNotificationRef = useRef(false);

  const loadTracking = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const trackingData = await orderAPI.getTrackingById(orderId);
      setTracking(trackingData);

      if (!trackingData) {
        setError('Impossible de charger le suivi de commande.');
      }
    } catch {
      setError('Impossible de charger le suivi de commande.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadTracking();
  }, [loadTracking]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadTracking(true);
    }, POLLING_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [loadTracking]);

  useEffect(() => {
    if (!tracking?.status) {
      return;
    }

    const previousStatus = previousStatusRef.current;
    const nextStatus = tracking.status;

    if (
      previousStatus &&
      previousStatus !== 'delivered' &&
      nextStatus === 'delivered' &&
      !hasSentDeliveredNotificationRef.current
    ) {
      hasSentDeliveredNotificationRef.current = true;
      void notifications.sendOrderDelivered(orderId, tracking.restaurant?.name || undefined);
    }

    previousStatusRef.current = nextStatus;
  }, [orderId, tracking]);

  return {
    tracking,
    loading,
    refreshing,
    error,
    refreshTracking: () => loadTracking(true),
    retryLoadTracking: loadTracking,
  };
}

export default useOrderTracking;
