# estiam-e4-react-native

## Home Screen API Loading and Error Handling

- Restaurants on the home screen are loaded from the API through `restaurantAPI.getRestaurants()`.
- Loading and error handling were added in `foodie-spot/app/(tabs)/index.tsx`.
- The previous commented loader was replaced with a visible spinner using `ActivityIndicator`.
- The screen now handles loading, error, retry, empty, and success states correctly.
- Restaurant loading no longer falls back to cached or mock-style data when the backend is unavailable.
- If the backend server is stopped or unreachable, the home screen now shows the error state instead of silently displaying an empty result.
- The Home and Search restaurant feeds now use `FlatList` instead of `ScrollView + .map()`, with stable `keyExtractor` keys and memoized row rendering where useful for better list performance.

## Quick Audit

### Main Issues Found

- Duplication: `useOffline` exists in three files and the auth screens duplicate a large part of their form UI and styles.
- Inconsistent styles: colors, spacing, loading states, and empty states are hardcoded per screen instead of sharing common tokens/components.
- Logic inside components: Home, Profile, and Restaurant screens mix UI, data loading, transformation, and side effects in the same file.
- Scattered network integration: API behavior is centralized in `services/api.ts`, but some methods were incomplete or inconsistent with backend routes.
- Typing and validation have been tightened, but backend and frontend models still deserve continued alignment as the API evolves.
- Error handling is inconsistent: some calls throw errors, others silently return fallback values, which makes UI behavior harder to reason about.
- Backend structure is monolithic: `foodiespot-backend/server.js` groups many domains in one file, which increases maintenance cost.

### Where To Apply Improvements

- Frontend service layer: normalize endpoints, response parsing, and error strategy in `foodie-spot/services/api.ts`.
- Auth flow: extract shared auth form pieces and centralize validation/error mapping across login and register.
- Screen hooks: move fetch and mutation logic out of `index.tsx`, `profile.tsx`, and `restaurant/[id].tsx`.
- Shared UI system: centralize reusable loading, empty, and error components plus spacing/color tokens.
- Types and validation: tighten `foodie-spot/types/index.ts` and add request validation in both frontend and backend.
- Backend structure: split `foodiespot-backend/server.js` by domain, starting with auth, users, restaurants, and uploads.

## Implemented From This Audit

- Restaurant loading now surfaces backend failures instead of silently falling back to cached data on the Home screen.
- Favorites toggling is now wired to the real backend endpoint instead of calling an empty frontend method.
- Offline order synchronization is now connected to the backend `/sync/orders` endpoint from the frontend service layer.
- Restaurant `deliveryTime` typing now matches the backend shape more closely, reducing UI-side casting logic.
- Auth-related user normalization is now centralized in `foodie-spot/services/auth.ts`, including consistent handling of `avatar` and `photo`.
- Auth form validation is now centralized through shared helpers, covering required fields, email format, password length, and password confirmation.
- Remaining active `any` usages in the main frontend code were removed in favor of stricter typed helpers for storage, auth/API error handling, upload data, and offline order state.
- The profile screen now relies on the auth context/service for user state, profile updates, refresh, and logout instead of mixing auth-owned logic into the screen.
- Notification state loading is now centralized in `foodie-spot/services/notification.ts`, with `use-notifications.ts` acting as a thin adapter over the service.
- The duplicate `use-offline-copy.ts` file was removed to reduce duplicated network/offline logic.
- A small focused test suite was added for shared validation and API utility logic, covering auth form rules, API response unwrapping, error mapping, and offline order filtering.

## Custom Hooks Refactor

- Screen-level business logic was extracted into coherent custom hooks with consistent `use...` naming.
- Added hooks: `useHomeRestaurants`, `useOrders`, `useRestaurantDetails`, `useRestaurantSearch`, `useOrderTracking`, and `useProfileScreen`.
- Home, Orders, Search, Restaurant Details, Tracking, and Profile screens now focus primarily on rendering and user interactions instead of owning fetch/mutation workflows directly.
- Hook responsibilities are now clearer: data loading, refresh and retry behavior, derived state, and service calls live in hooks; screens consume hook state and callbacks.

## Path Alias Cleanup

- Deep relative imports were replaced with the `@/` path alias where possible.
- Example: `../../services/api` becomes `@/services/api`.
- This does not change application behavior, but it improves readability, consistency, and maintainability.
- It also makes refactoring easier because imports are less fragile when files are moved inside nested folders.

## DRY UI Components

- Reusable UI state components were added to reduce duplicated screen markup:
  `LoadingState`, `ErrorState`, and `EmptyState`.
- These shared components are now used across Home, Orders, Search, Restaurant Details, and Tracking screens.
- This improves consistency for loaders, retry/error blocks, and empty-state rendering while reducing repeated JSX and style definitions.

## Render Optimizations

- Light memoization was added on shared visual components such as restaurant, dish, order, and category list items to reduce unnecessary re-renders.
- List rendering was stabilized with memoized `renderItem` callbacks and stable keys on the main collection screens, while keeping the optimization scope intentionally lightweight.

## Accessibility And Ergonomics

- Touch targets were improved for small icon actions such as password visibility toggles, restaurant header actions, and the profile camera button.
- Accessibility labels and button roles were added to important icon-only or tappable UI elements to improve usability.
- Weak gray text colors were strengthened in several screens and cards to improve readability and contrast.
- Visual feedback was reinforced through clearer interactive states on tappable cards and existing loading, error, retry, toast, and favorite-state feedback.

## Visual Consistency

- A shared warm palette was centralized in `foodie-spot/constants/theme.ts` with semantic tokens for primary, secondary, text, surfaces, borders, success, warning, error, and gradients.
- Hardcoded conflicting accent colors were reduced on key screens such as Home, Notifications, Auth, Profile, Restaurant Details, and reusable cards.
- Repeated spacing and radius values were partially harmonized through shared `Spacing` and `Radius` tokens.
- Inline styling was reduced where it was repetitive, including the Home header layout.

## Images And Assets

- Image and asset handling was streamlined through a shared asset constant for placeholders instead of scattered inline asset references.
- Main remote images now use `expo-image` caching with `memory-disk` policy, cover fitting, and light transitions on restaurant cards, dish cards, detail screens, and the profile avatar.

## Network, Errors, And State Management

- API calls are centralized through `foodie-spot/services/api.ts`, including shared base URL, headers, timeout handling, response parsing, and axios interceptors.
- User-facing API error messages are normalized through a shared helper so timeout, offline, and server-side failures are easier to surface consistently.
- Loading, empty, and error states are handled in the main screens through shared components and screen hooks.
- Auth persistence is handled in `foodie-spot/services/auth.ts` with `expo-secure-store` when available and an `AsyncStorage` fallback only when secure storage is unavailable.
- Frontend typing, linting, and the focused unit test script now all pass locally through `npx tsc --noEmit`, `npm run lint`, and `npm test`.
- Access token refresh is now wired through the auth service and axios response interceptor, allowing protected requests to retry once after a `401` when a refresh token is available.
- Protected routes are enforced from `foodie-spot/app/_layout.tsx`, and logout now clears stored auth state reliably before redirecting back to the auth flow.
- Remaining legacy auth storage reads were removed from the active request flow so tokens, stored user data, favorites, refresh, and logout now rely on a single auth service path.
- Frontend lint currently passes after cleaning the remaining auth/profile/notifications/dish warnings and errors.

## Security And Permissions

- Frontend and backend configuration were reviewed to avoid exposed secrets, including stricter `.env` ignore rules and safer backend JWT secret handling without hardcoded production fallbacks.
- Permission declarations were clarified for location, photo library, and notifications in the Expo app configuration.
- Permission refusal UX was improved so the app now gives clearer feedback when location, photo access, or notifications are denied instead of failing silently or leaving vague states.

## II - Areas For Improvement

### 1. Home (`app/(tabs)/index.tsx`)

- Status: implemented and verified.
- Restaurants are loaded from the API with visible loading and error states kept in place on the Home screen.
- The promo banner is now dynamic and fetched from a dedicated backend endpoint instead of being hardcoded in the UI.
- The search button navigation to the Search screen was verified and remains wired through the tab route.
- The `Nearby` section now uses user geolocation and backend-supported `lat`, `lng`, `radius`, and distance sorting to display closer restaurants first when location is available.
- A lightweight `EN` / `FR` multilingual system was added with persisted language selection and translated core app navigation and screen text.

### 2. Search (`app/(tabs)/search.tsx`)

- Status: implemented and verified.
- Search requests are now debounced before triggering API calls, which avoids sending a request on every typed character.
- Cuisine filters now have a clearly active visual state, including a selected background color instead of only changing text color.
- The cuisine filter list is no longer hardcoded and is now loaded from the backend categories endpoint (`GET /categories`).
- The results list already uses `FlatList`, and loading, empty, and error states remain handled explicitly in the screen.

### 3. Orders (`app/(tabs)/orders.tsx`)

- Status: implemented and verified.
- Orders continue to load from the API, and the screen now keeps a visible spinner during loading instead of leaving the area blank.
- The empty state no longer shows a raw placeholder text and now displays a proper package illustration.
- Status filter tabs were added for `All`, `In Progress`, `Delivered`, and `Cancelled` to make the order list easier to browse.
- Each order card now opens either live tracking (`/tracking/:orderId`) for active orders or a dedicated order details screen for completed and cancelled orders.

### 4. Profile (`app/(tabs)/profile.tsx`)

- Status: implemented and verified.
- Profile identity data now refreshes from the API instead of relying only on stored local auth state, and the stats block now uses dynamic values for order count, favorites, and review average.
- The previous `!user` fallback was replaced with a proper loading skeleton so the screen no longer renders a half-empty profile shape while data is still being fetched.
- The logout flow was rechecked with the current auth guard and token clearing path so returning to the login screen works cleanly without keeping stale protected state around.
- The broken `Mes favoris` destination was fixed by adding a real favorites screen and wiring the Profile menu item to it.
- Relative `../../services/api` style imports were verified and cleaned up in this area so the Profile flow stays aligned with the `@/` alias convention used elsewhere.

### 5. Notifications (`app/(tabs)/notifications.tsx`)

- Status: implemented and verified.
- The render loop caused by `useEffect` without dependencies was removed, and notification refresh now goes through a single typed hook path instead of being triggered on every render.
- Permissions, device environment, badge count, scheduled notification count, and stored preferences are now exposed clearly in the UI with a dedicated initialization action and refresh action.
- Notification state handling was tightened in the service and hook so permission status, badges, scheduled notifications, and device type stay typed and refreshed together.
- Logs in the UI were reduced to a short recent-events list, and loading and error states are now shown explicitly instead of relying on noisy console-style feedback.

### 6. Restaurant Detail (`app/restaurant/[id].tsx`)

- Status: implemented and verified.
- The plain text loading state was replaced with a richer skeleton layout so the restaurant detail screen feels structured while content is loading.
- The `Itinéraire` and `Appeler` buttons now perform real actions by opening the device maps app and the phone dialer when restaurant data is available.
- The share action was checked and kept correctly wired to a dedicated share handler rather than a favorite toggle.
- The `deliveryTime` backend shape was verified as already correctly typed with `number | { min, max }`, and the detail screen continues to consume the safer derived label from the hook instead of fragile JSX casting.


### 7. Dish Detail (`app/dish/[id].tsx`)

- Status: implemented and verified.
- The dish screen no longer searches through hardcoded restaurant IDs and now fetches the dish from a dedicated API endpoint, with optional `restaurantId` support when available.
- The `Ajouter au panier` button now performs a real local cart write through a small cart service backed by storage, with quantity handling and success feedback.
- Loading, retryable error, and empty states were added so the screen no longer jumps from a blank page to content without feedback.
- The fragile `marginTop: -100` layout hack was removed in favor of a normal safe-area layout that behaves more predictably across devices.


### 8. Order Tracking (`app/tracking/[orderId].tsx`)

- Status: implemented and verified.
- The tracking screen now uses the dedicated backend tracking payload instead of the simpler order detail response, which allowed the UI to display the order timeline, driver details, estimated arrival, and a live-location placeholder block.
- Pull-to-refresh was added and the hook now polls the backend on an interval so the screen can follow order progression over time instead of staying static after first load.
- Proper loading, retryable error, and empty states are now handled explicitly in the tracking flow.


### 9. Login (`app/(auth)/login.tsx`)

- Status: implemented and verified.
- Login validation was strengthened with a stricter email regex and an enforced minimum password length of 8 characters instead of only checking for non-empty input.
- User-facing login errors were rechecked and kept clean, with no raw stack traces surfaced in the UI and no leftover debug-style console handling in the screen layer.
- The arbitrary `setTimeout(resolve, 100)` after login and registration was removed from the auth context, and authentication state now updates directly from the real login/register result instead of waiting on an artificial delay.

### 10. Register (`app/(auth)/register.tsx`)

- Status: implemented and verified.
- Register validation now uses the stronger shared email regex and password confirmation rules instead of relying on a single generic validation outcome.
- The screen now shows inline error messages per field, with visual error styling on the affected inputs, instead of only surfacing one global message block at the top.


### 11. Layout / Auth Guard (`app/_layout.tsx`)

- Status: implemented and verified.
- The root auth guard was rewritten to rely on the full pathname instead of the more fragile `segments[0]`, which makes route protection easier to reason about and less sensitive to nested route structure.
- Redirect protection was added so the layout does not keep trying to replace the route with the same target, which reduces the risk of double redirections.
- Login routes remain accessible only while logged out, and the `(tabs)` plus other app-content routes remain protected when the user is disconnected.
- The old `refreshAuth` loop mentioned in the initial audit was already absent by the time of this implementation pass, so the remaining work focused on preventing redirect churn rather than patching another refresh cycle.
- Missing route registrations (`cart`, `checkout`, and `review/[orderId]`) were removed from the root stack so the layout no longer references screens that do not exist in the app.


### 12. Missing Screens

- Status: implemented and verified.
- `cart` now exists as a real cart screen with local cart listing, quantity updates, subtotal display, and a checkout CTA.
- `checkout` now exists as a real order-validation screen with delivery address input, payment method selection, promo-code validation, and order confirmation against the backend order API.
- `review/[orderId]` now exists as a real review screen with rating, comment, optional photo selection/upload, and submission to the backend review API.
- The root layout now references these screens again because they exist for real instead of being dead route declarations.
- Why this choice: these routes were already part of the intended product flow, so leaving them missing created gaps exactly where purchase completion and post-delivery feedback should happen.
- User value: users can now move from adding items to cart, through checkout, and into post-delivery review without hitting missing-screen dead ends.
- Main difficulties: checkout had to bridge local cart storage with backend cart/order/promo validation, and the review flow needed to work with the existing upload and review endpoints without introducing a full new media pipeline.

## III - Features To Implement

### 1. Interactive Promo Code System

- Status: implemented and verified.
- The checkout screen now validates promo codes in near real time with a short debounce instead of relying only on a manual button press.
- The discount amount is displayed dynamically in the order summary before confirmation, including delivery-fee promos such as free delivery.
- Promo feedback is now shown inline with explicit loading, success, and error messages so invalid codes and minimum-order constraints are understandable without guessing.
- Why this choice: the promo flow was already partially present in checkout and on the backend, so extending it into a more interactive feature gave strong visible value with limited implementation risk.
- User value: users can instantly understand whether a code works, how much they save, and why a code is rejected before placing the order.
- Main difficulties: the backend and frontend were not using the exact same promo response shape at first, so the main work was aligning discount mapping and keeping the summary accurate for both normal discounts and free-delivery promos.

### 2. Recent Searches And Suggestions

- Status: implemented and verified.
- Search terms are now persisted in `AsyncStorage` through the existing `RECENT_SEARCHES` key so the latest queries can be shown again when the search field is empty.
- The Search screen now displays recent searches as tappable chips, with a clear action to reset the stored history.
- Lightweight suggestions are now proposed while typing based on known restaurant names, cuisines, and loaded categories, and tapping one immediately fills the search input.
- Why this choice: the project already had a declared storage key and a debounced Search flow, so this feature fit naturally into the existing screen without backend changes.
- User value: users can repeat frequent searches faster, discover likely matches sooner, and reduce typing effort on mobile.
- Main difficulties: the challenge was keeping the feature lightweight and useful without introducing noisy or irrelevant suggestions, so the implementation focuses on app-known restaurant and category values rather than overcomplicating the matching logic.

### 3. Onboarding / First Launch Walkthrough

- Status: implemented and verified.
- A dedicated onboarding screen now appears only on the first app launch, with three simple slides introducing discovery, search, and tracking.
- The onboarding completion state is persisted in `AsyncStorage` through a dedicated `ONBOARDING_SEEN` key so returning users do not see the walkthrough again.
- The root layout now integrates onboarding into the startup navigation flow without colliding with the existing auth guard.
- Why this choice: onboarding is self-contained, visible immediately, and a good way to surface the app’s core value without needing backend changes.
- User value: first-time users get a clearer introduction to how the app works before reaching login and the main browsing flow.
- Main difficulties: the main challenge was coordinating the first-launch redirect with the existing protected-route logic so onboarding appears only once without causing redirect loops.

### 4. Dark Mode

- Status: implemented and verified.
- A persisted app theme system now supports `system`, `light`, and `dark` modes through a dedicated theme context and storage-backed preference.
- A manual theme selector was added to the Profile screen so users can choose a theme explicitly instead of only following the device setting.
- The main navigation surfaces and core shared UI were updated to react to the active theme, including onboarding, login, register, Home, Search, Orders, Profile, tab bar styling, loading states, error states, and the main restaurant and order cards.
- Why this choice: the project already had the base `useColorScheme` hook and a partial color token setup, so dark mode was a natural extension with strong visual impact.
- User value: users can browse the app more comfortably in low-light conditions and keep a manual preference that matches their personal reading comfort.
- Main difficulties: many screens originally referenced light-only colors directly, so the biggest part of the work was centralizing the resolved theme and replacing hardcoded screen styles without destabilizing the existing navigation flow.

### 5. Review System With Photos And Per-Criterion Ratings

- Status: implemented and verified.
- The review screen now supports a global rating plus three criterion ratings for quality, speed, and presentation, while keeping the existing optional photo upload flow.
- Review submission now sends these criterion ratings to the backend review endpoint together with the main rating, comment, and uploaded image URLs.
- The restaurant detail screen now loads existing reviews from `GET /restaurants/:id/reviews` and displays a review summary, verified-purchase feedback, criterion badges, comments, and uploaded review photos.
- Why this choice: the review route and upload flow already existed, so extending them into a richer review system created a stronger “post-delivery” feature without needing a new product flow.
- User value: users can give more useful feedback after delivery and future customers can read richer, more trustworthy restaurant reviews directly on the restaurant page.
- Main difficulties: the backend already accepted criterion fields, but the frontend had to align new types, submission payloads, and restaurant-side display while keeping the review flow simple enough to use on mobile.
