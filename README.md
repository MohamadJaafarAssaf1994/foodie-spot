# estiam-e4-react-native

## Home Screen API Loading and Error Handling

- Restaurants on the home screen are loaded from the API through `restaurantAPI.getRestaurants()`.
- Loading and error handling were added in `foodie-spot/app/(tabs)/index.tsx`.
- The previous commented loader was replaced with a visible spinner using `ActivityIndicator`.
- The screen now handles loading, error, retry, empty, and success states correctly.
- Restaurant loading no longer falls back to cached or mock-style data when the backend is unavailable.
- If the backend server is stopped or unreachable, the home screen now shows the error state instead of silently displaying an empty result.

## Quick Audit

### Main Issues Found

- Duplication: `useOffline` exists in three files and the auth screens duplicate a large part of their form UI and styles.
- Inconsistent styles: colors, spacing, loading states, and empty states are hardcoded per screen instead of sharing common tokens/components.
- Logic inside components: Home, Profile, and Restaurant screens mix UI, data loading, transformation, and side effects in the same file.
- Scattered network integration: API behavior is centralized in `services/api.ts`, but some methods were incomplete or inconsistent with backend routes.
- Typing and validation gaps: some `any` usage remains, frontend form validation is basic, and some types do not fully match backend payloads.
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
- The profile screen now relies on the auth context/service for user state, profile updates, refresh, and logout instead of mixing auth-owned logic into the screen.
- Notification state loading is now centralized in `foodie-spot/services/notification.ts`, with `use-notifications.ts` acting as a thin adapter over the service.
- The duplicate `use-offline-copy.ts` file was removed to reduce duplicated network/offline logic.

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

## Network, Errors, And State Management

- API calls are centralized through `foodie-spot/services/api.ts`, including shared base URL, headers, timeout handling, response parsing, and axios interceptors.
- User-facing API error messages are normalized through a shared helper so timeout, offline, and server-side failures are easier to surface consistently.
- Loading, empty, and error states are handled in the main screens through shared components and screen hooks.
- Auth persistence is handled in `foodie-spot/services/auth.ts` with `expo-secure-store` when available and an `AsyncStorage` fallback only when secure storage is unavailable.
- Access token refresh is now wired through the auth service and axios response interceptor, allowing protected requests to retry once after a `401` when a refresh token is available.
- Protected routes are enforced from `foodie-spot/app/_layout.tsx`, and logout now clears stored auth state reliably before redirecting back to the auth flow.
- Remaining legacy auth storage reads were removed from the active request flow so tokens, stored user data, favorites, refresh, and logout now rely on a single auth service path.
- Frontend lint currently passes after cleaning the remaining auth/profile/notifications/dish warnings and errors.
