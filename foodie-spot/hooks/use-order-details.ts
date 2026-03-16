import { useCallback, useEffect, useState } from 'react';

import { orderAPI } from '@/services/api';
import { Order } from '@/types';

export function useOrderDetails(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const data = await orderAPI.getOrderById(orderId);
      setOrder(data);
      if (!data) {
        setError('Commande introuvable.');
      }
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
    reloadOrder: loadOrder,
  };
}

export default useOrderDetails;
