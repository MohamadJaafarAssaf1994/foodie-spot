import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme as useNativeColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { STORAGE_KEYS, storage } from '@/services/storage';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  colorScheme: NonNullable<ColorSchemeName>;
  colors: typeof Colors.light;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useNativeColorScheme() ?? 'light';
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    const loadThemeMode = async () => {
      const storedMode = await storage.getItem<ThemeMode>(STORAGE_KEYS.THEME_MODE);
      if (storedMode === 'light' || storedMode === 'dark' || storedMode === 'system') {
        setModeState(storedMode);
      }
    };

    void loadThemeMode();
  }, []);

  const setMode = async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await storage.setItem(STORAGE_KEYS.THEME_MODE, nextMode);
  };

  const value = useMemo<ThemeContextValue>(() => {
    const colorScheme = mode === 'system' ? systemColorScheme : mode;

    return {
      mode,
      setMode,
      colorScheme,
      colors: Colors[colorScheme],
      isDark: colorScheme === 'dark',
    };
  }, [mode, systemColorScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }

  return context;
}
