import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { Locale, translations, TranslationKey } from '@/constants/translations';

const STORAGE_KEY = 'app_locale';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const getDefaultLocale = (): Locale => {
  const languageCode = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0];
  return languageCode === 'fr' ? 'fr' : 'en';
};

const interpolate = (template: string, params?: Record<string, string | number>) => {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    template
  );
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getDefaultLocale());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(stored => {
      if (stored === 'fr' || stored === 'en') {
        setLocaleState(stored);
      }
    });
  }, []);

  const setLocale = async (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    await AsyncStorage.setItem(STORAGE_KEY, nextLocale);
  };

  const value = useMemo<I18nContextType>(() => ({
    locale,
    setLocale,
    t: (key, params) => interpolate(translations[locale][key], params),
  }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
