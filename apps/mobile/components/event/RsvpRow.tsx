import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography';
import type { RsvpStatus } from '@hang/shared';

interface RsvpRowProps {
  current: RsvpStatus | null;
  onRsvp: (status: RsvpStatus) => void;
  isLoading?: boolean;
}

const OPTIONS: { status: RsvpStatus; label: string; emoji: string }[] = [
  { status: 'going', label: 'Going', emoji: '✓' },
  { status: 'maybe', label: 'Maybe', emoji: '~' },
  { status: 'cant', label: "Can't", emoji: '✗' },
];

export function RsvpRow({ current, onRsvp, isLoading }: RsvpRowProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;

  const handlePress = (status: RsvpStatus) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRsvp(status);
  };

  return (
    <View style={styles.row} testID="rsvp-row">
      {OPTIONS.map(({ status, label, emoji }) => {
        const isActive = current === status;
        return (
          <TouchableOpacity
            key={status}
            testID={`rsvp-${status}`}
            onPress={() => handlePress(status)}
            disabled={isLoading}
            style={[
              styles.button,
              {
                backgroundColor: isActive ? colors.accent : colors.surfaceAlt,
                borderColor: isActive ? colors.accent : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            {isActive && <Text style={styles.check}>{emoji} </Text>}
            <Text
              style={[
                styles.label,
                { color: isActive ? '#ffffff' : colors.textSecondary },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing['2'],
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3'],
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  check: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
    color: '#ffffff',
  },
  label: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
});
