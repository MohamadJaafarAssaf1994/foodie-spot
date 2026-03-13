import { useCallback, useEffect, useState } from 'react';

import { orderAPI } from '@/services/api';
import { Order } from '@/types';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setError(null);
      const data = await orderAPI.getOrders();
      setOrders(data);
    } catch {
      setError('Impossible de charger les commandes.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return {
    orders,
    loading,
    refreshing,
    error,
    refreshOrders,
    retryLoadOrders: loadOrders,
  };
}

export default useOrders;
