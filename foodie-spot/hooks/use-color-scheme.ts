import { useAppTheme } from '@/contexts/theme-context';

export function useColorScheme() {
  const { colorScheme } = useAppTheme();
  return colorScheme;
}
