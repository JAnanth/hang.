import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors.js';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography.js';
import type { EventType } from '@hang/shared';

interface TimingOption {
  type: EventType;
  label: string;
}

const OPTIONS: TimingOption[] = [
  { type: 'planned', label: 'Set a time' },
  { type: 'voting', label: 'Let people vote' },
  { type: 'quick', label: 'Spontaneous' },
];

interface TimingToggleProps {
  selected: EventType;
  onSelect: (type: EventType) => void;
}

export function TimingToggle({ selected, onSelect }: TimingToggleProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      {OPTIONS.map(({ type, label }) => {
        const isActive = selected === type;
        return (
          <TouchableOpacity
            key={type}
            testID={`timing-${type}`}
            onPress={() => onSelect(type)}
            style={[
              styles.option,
              isActive && { backgroundColor: colors.surface },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isActive ? colors.textPrimary : colors.textSecondary,
                  fontFamily: isActive ? FontFamily.sansSemiBold : FontFamily.sans,
                },
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
  container: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 3,
  },
  option: {
    flex: 1,
    paddingVertical: Spacing['2'],
    paddingHorizontal: Spacing['2'],
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});
