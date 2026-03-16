import type { Locale } from '@/constants/translations';
import type { Category } from '@/types';

const restaurantDescriptionTranslations: Record<string, string> = {
  r1: 'Bistronomic cuisine made with fresh ingredients',
  r2: 'Sushi rolls, poke bowls, and Japanese specialties',
  r3: 'The city\'s best handcrafted burgers, prepared with fresh local ingredients.',
  r4: 'Authentic Neapolitan pizzas baked in a wood-fired oven by our Italian chef.',
  r5: 'Authentic Mexican tacos made from family recipes passed down for three generations.',
  r6: 'Healthy bowls and gourmet salads prepared with organic seasonal ingredients.',
};

const dishDescriptionTranslations: Record<string, string> = {
  d1: 'French onion soup gratinated with cheese',
  d2: '6 Burgundy snails with parsley butter',
  d3: 'Mixed salad with tuna, eggs, anchovies, and olives',
  d4: 'Beef slow-cooked in red wine with seasonal vegetables',
  d5: 'Free-range chicken simmered in red wine with bacon and mushrooms',
  d6: 'Roasted duck breast, red fruit sauce, and potato gratin',
  d7: '300g grilled rib steak, pepper sauce, and homemade fries',
  d8: 'Caramelized apple tart, served warm',
  d9: 'Vanilla custard with a crisp caramelized topping',
  d10: 'Smooth mousse made with 70% dark chocolate',
  d11: 'Choux pastries filled with vanilla ice cream and hot chocolate sauce',
  d12: 'Lightly salted steamed soybeans',
  d13: 'Seaweed salad with sesame dressing',
  d14: '6 pan-fried Japanese dumplings with pork and vegetables',
  d15: 'Sushi roll with crab, avocado, and cucumber',
  d16: 'Assortment of 12 sushi and assorted maki',
  d17: '8 slices of fresh salmon sashimi',
  d18: 'Shrimp tempura, avocado, and grilled eel roll',
  d19: 'Rice, marinated salmon, avocado, edamame, cucumber, and soy sauce',
  d20: 'Rice, marinated tuna, mango, radish, red cabbage, and ponzu sauce',
  d21: 'Rice, grilled tofu, avocado, seaweed, and sesame seeds',
  d22: 'Rice, salmon and tuna, avocado, cucumber, and teriyaki sauce',
  d23: 'Selection of 3 iced mochi (vanilla, green tea, strawberry)',
  d24: 'Japanese pancakes filled with sweet red bean paste',
  b1: '150g beef patty, aged cheddar, lettuce, tomato, red onion, and house sauce',
  b2: '150g beef patty, double crispy bacon, cheddar, caramelized onions, and BBQ sauce',
  b3: 'Beyond Meat plant-based patty, avocado, arugula, sun-dried tomato, and tahini sauce',
  s1: 'Fresh hand-cut fries with Guérande sea salt',
  s2: 'Homemade breaded onion rings with aioli sauce',
  p1: 'Tomato sauce, fior di latte mozzarella, fresh basil, and olive oil',
  p2: 'Mozzarella, gorgonzola, parmesan, and fresh goat cheese',
  p3: 'Tomato sauce, mozzarella, spicy salami, and chili peppers',
  t1: 'Marinated pork, pineapple, coriander, and onion',
  t2: 'Slow-cooked pulled pork, salsa verde, and onion',
  t3: 'Black beans, grilled corn, peppers, and guacamole',
  ts1: 'Fresh homemade guacamole with corn chips',
  ts2: 'Chips, melted cheese, jalapeños, cream, and salsa',
  gb1: 'Quinoa, chickpeas, avocado, sweet potato, kale, and tahini',
  gb2: 'Seasoned rice, marinated salmon, avocado, edamame, and mango',
  gb3: 'Quinoa, grilled chicken, broccoli, avocado, and pumpkin seeds',
  gs1: 'Romaine, grilled chicken, parmesan, whole-grain croutons, and light dressing',
  gs2: 'Mixed greens, avocado, cucumber, feta, mint, and lemon',
  gj1: 'Spinach, apple, cucumber, lemon, and ginger',
  gj2: 'Blueberries, strawberries, banana, and almond milk',
};

const categoryNameTranslations: Record<string, string> = {
  burger: 'Burger',
  pizza: 'Pizza',
  sushi: 'Sushi',
  tacos: 'Tacos',
  pates: 'Pasta',
  salades: 'Salads',
  asiatique: 'Asian',
  desserts: 'Desserts',
  healthy: 'Healthy',
  indien: 'Indian',
};

export const localizeRestaurantDescription = (id: string, description: string, locale: Locale) => {
  if (locale === 'en') {
    return restaurantDescriptionTranslations[id] ?? description;
  }

  return description;
};

export const localizeDishDescription = (id: string, description: string, locale: Locale) => {
  if (locale === 'en') {
    return dishDescriptionTranslations[id] ?? description;
  }

  return description;
};

export const localizeCategoryName = (category: Pick<Category, 'slug' | 'name'>, locale: Locale) => {
  if (locale === 'en') {
    return categoryNameTranslations[category.slug] ?? category.name;
  }

  return category.name;
};
