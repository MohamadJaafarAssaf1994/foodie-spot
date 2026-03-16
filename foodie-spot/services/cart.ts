import { restaurantAPI } from '@/services/api';
import { CartItem, CartTotals, Dish } from '@/types';
import { storage, STORAGE_KEYS } from '@/services/storage';

class CartService {
  async getCart(): Promise<CartItem[]> {
    const storedCart = (await storage.getItem<CartItem[]>(STORAGE_KEYS.CART)) || [];
    const missingRestaurantIds = storedCart.filter(item => !item.dish.restaurantId);

    if (missingRestaurantIds.length === 0) {
      return storedCart;
    }

    const repairedCart = await Promise.all(
      storedCart.map(async item => {
        if (item.dish.restaurantId) {
          return item;
        }

        const repairedDish = await restaurantAPI.getDishById(item.dish.id);
        return repairedDish
          ? { ...item, dish: { ...item.dish, restaurantId: repairedDish.restaurantId } }
          : item;
      })
    );

    await storage.setItem(STORAGE_KEYS.CART, repairedCart);
    return repairedCart;
  }

  async addItem(dish: Dish, quantity: number): Promise<CartItem[]> {
    const currentCart = await this.getCart();
    const existingItem = currentCart.find(item => item.dish.id === dish.id);

    const nextCart = existingItem
      ? currentCart.map(item =>
          item.dish.id === dish.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      : [...currentCart, { dish, quantity }];

    await storage.setItem(STORAGE_KEYS.CART, nextCart);
    return nextCart;
  }

  async updateQuantity(dishId: string, quantity: number): Promise<CartItem[]> {
    const currentCart = await this.getCart();
    const nextCart =
      quantity <= 0
        ? currentCart.filter(item => item.dish.id !== dishId)
        : currentCart.map(item =>
            item.dish.id === dishId
              ? { ...item, quantity }
              : item
          );

    await storage.setItem(STORAGE_KEYS.CART, nextCart);
    return nextCart;
  }

  async removeItem(dishId: string): Promise<CartItem[]> {
    return this.updateQuantity(dishId, 0);
  }

  async clear(): Promise<void> {
    await storage.removeItem(STORAGE_KEYS.CART);
  }

  getTotals(items: CartItem[]): CartTotals {
    return items.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + item.dish.price * item.quantity,
        itemCount: acc.itemCount + item.quantity,
      }),
      { subtotal: 0, itemCount: 0 }
    );
  }
}

export const cart = new CartService();
export default cart;
