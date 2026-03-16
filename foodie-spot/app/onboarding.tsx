import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Compass, Search, Truck } from 'lucide-react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { useI18n } from '@/contexts/i18n-context';
import { useAppTheme } from '@/contexts/theme-context';
import { storage, STORAGE_KEYS } from '@/services/storage';

type Slide = {
  key: string;
  title: string;
  body: string;
  icon: React.ReactNode;
};

export default function OnboardingScreen() {
  const { t } = useI18n();
  const { colors } = useAppTheme();
  const [index, setIndex] = useState(0);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const slides = useMemo<Slide[]>(() => ([
    {
      key: 'discover',
      title: t('onboarding_title_1'),
      body: t('onboarding_body_1'),
      icon: <Compass size={56} color={colors.primary} />,
    },
    {
      key: 'search',
      title: t('onboarding_title_2'),
      body: t('onboarding_body_2'),
      icon: <Search size={56} color={colors.primary} />,
    },
    {
      key: 'tracking',
      title: t('onboarding_title_3'),
      body: t('onboarding_body_3'),
      icon: <Truck size={56} color={colors.primary} />,
    },
  ]), [colors.primary, t]);

  const currentSlide = slides[index];
  const isLastSlide = index === slides.length - 1;

  const completeOnboarding = async () => {
    await storage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, true);
    router.replace('/login');
  };

  const handleNext = async () => {
    if (isLastSlide) {
      await completeOnboarding();
      return;
    }

    setIndex(prev => prev + 1);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => void completeOnboarding()}>
          <Text style={styles.skip}>{t('onboarding_skip')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={styles.iconWrap}>{currentSlide.icon}</View>
        <Text style={styles.title}>{currentSlide.title}</Text>
        <Text style={styles.body}>{currentSlide.body}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, slideIndex) => (
            <View
              key={slide.key}
              style={[styles.dot, slideIndex === index && styles.dotActive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={() => void handleNext()}>
          <Text style={styles.buttonText}>
            {isLastSlide ? t('onboarding_get_started') : t('onboarding_next')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'flex-end',
    paddingTop: Spacing.md,
  },
  skip: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.pill,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
