export const LightColors = {
  background: '#faf8f4',
  surface: '#ffffff',
  surfaceAlt: '#f0ede8',
  border: '#ede9e2',
  textPrimary: '#1a1917',
  textSecondary: '#8a8278',
  textTertiary: '#b0a89e',
  accent: '#c17f3b',
  darkSurface: '#1a1917',
  error: '#c0392b',
  success: '#27ae60',
} as const;

export const DarkColors = {
  background: '#121110',
  surface: '#1e1c1a',
  surfaceAlt: '#252320',
  border: '#2e2b27',
  textPrimary: '#f0ede8',
  textSecondary: '#8a8278',
  textTertiary: '#6b6460',
  accent: '#d4924d',
  darkSurface: '#0d0c0b',
  error: '#e74c3c',
  success: '#2ecc71',
} as const;

export type ColorScheme = typeof LightColors;

const avatarPalette = [
  '#7B8FA1',
  '#8FA17B',
  '#A17B8F',
  '#7B9EA1',
  '#A19E7B',
  '#9B7BA1',
  '#7BA19E',
  '#A18B7B',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return avatarPalette[Math.abs(hash) % avatarPalette.length];
}
