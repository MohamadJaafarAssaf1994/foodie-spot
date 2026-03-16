/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#F97316';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#111827',
    textMuted: '#4B5563',
    textSubtle: '#6B7280',
    background: '#FFFDF9',
    surface: '#FFFFFF',
    surfaceMuted: '#FFF7ED',
    border: '#FED7AA',
    tint: tintColorLight,
    primary: '#F97316',
    primaryStrong: '#EA580C',
    secondary: '#FB923C',
    accent: '#FDBA74',
    icon: '#6B7280',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    info: '#C2410C',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorLight,
    gradientStart: '#F97316',
    gradientEnd: '#FB923C',
  },
  dark: {
    text: '#ECEDEE',
    textMuted: '#C7CDD3',
    textSubtle: '#9BA1A6',
    background: '#111315',
    surface: '#1A1D21',
    surfaceMuted: '#22262B',
    border: '#343A40',
    tint: '#FB923C',
    primary: '#FB923C',
    primaryStrong: '#F97316',
    secondary: '#FDBA74',
    accent: '#FED7AA',
    icon: '#9BA1A6',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#F87171',
    info: '#FB923C',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FB923C',
    gradientStart: '#7C2D12',
    gradientEnd: '#C2410C',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
