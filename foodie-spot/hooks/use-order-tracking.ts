import { useCallback, useEffect, useState } from 'react';

import { orderAPI } from '@/services/api';
import { Order } from '@/types';

export function useOrderTracking(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      setError(null);
      const orderData = await orderAPI.getOrderById(orderId);
      setOrder(orderData);
    } catch {
      setError('Impossible de charger la commande.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  return {
    order,
    loading,
    error,
    retryLoadOrder: loadOrder,
  };
}

export default useOrderTracking;
