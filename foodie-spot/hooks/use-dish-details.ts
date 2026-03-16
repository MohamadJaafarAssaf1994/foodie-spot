import { useCallback, useEffect, useMemo, useState } from 'react';

import { cart } from '@/services/cart';
import { restaurantAPI } from '@/services/api';
import type { Dish } from '@/types';

export function useDishDetails(id: string, restaurantId?: string) {
  const [dish, setDish] = useState<Dish | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDish = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const nextDish = await restaurantAPI.getDishById(id, restaurantId);
      setDish(nextDish);
      if (!nextDish) {
        setError('Plat introuvable.');
      }
    } catch {
      setError('Impossible de charger le plat.');
    } finally {
      setLoading(false);
    }
  }, [id, restaurantId]);

  useEffect(() => {
    void loadDish();
  }, [loadDish]);

  const incrementQuantity = useCallback(() => {
    setQuantity(current => current + 1);
  }, []);

  const decrementQuantity = useCallback(() => {
    setQuantity(current => Math.max(1, current - 1));
  }, []);

  const addToCart = useCallback(async () => {
    if (!dish) {
      return false;
    }

    try {
      setAddingToCart(true);
      setError(null);
      await cart.addItem(dish, quantity);
      return true;
    } catch {
      setError('Impossible d’ajouter ce plat au panier.');
      return false;
    } finally {
      setAddingToCart(false);
    }
  }, [dish, quantity]);

  const localizedPrice = useMemo(() => (dish ? `${dish.price} €` : ''), [dish]);

  return {
    dish,
    quantity,
    loading,
    error,
    addingToCart,
    localizedPrice,
    incrementQuantity,
    decrementQuantity,
    addToCart,
    retryLoadDish: loadDish,
  };
}

export default useDishDetails;
