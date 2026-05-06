import { Platform } from 'react-native';

export const FontFamily = {
  serifDisplay: 'DMSerifDisplay_400Regular',
  sansLight: 'DMSans_300Light',
  sans: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
} as const;

export const LineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
} as const;

export const Spacing = {
  '0.5': 2,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  pill: 999,
  bottomSheet: 28,
} as const;

export const Shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#1a1917',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
    default: {},
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#1a1917',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;
