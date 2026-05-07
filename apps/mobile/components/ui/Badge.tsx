import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily, FontSize, Radius } from '../../constants/typography';
import { LightColors } from '../../constants/colors';

interface BadgeProps {
  label: string;
  variant?: 'quick' | 'accent' | 'muted';
}

export function Badge({ label, variant = 'accent' }: BadgeProps) {
  const bgColor =
    variant === 'quick'
      ? LightColors.surfaceAlt
      : variant === 'accent'
      ? `${LightColors.accent}22`
      : LightColors.surfaceAlt;

  const textColor =
    variant === 'quick' ? LightColors.textPrimary : LightColors.accent;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
