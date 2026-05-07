import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography';
import type { GroupWithMembership } from '@hang/shared';

interface GroupMultiSelectProps {
  groups: GroupWithMembership[];
  selected: string[];
  onToggle: (groupId: string) => void;
}

export function GroupMultiSelect({ groups, selected, onToggle }: GroupMultiSelectProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {groups.map((group) => {
        const isSelected = selected.includes(group.id);
        return (
          <TouchableOpacity
            key={group.id}
            testID={`group-select-${group.name}`}
            onPress={() => onToggle(group.id)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? colors.textPrimary : colors.surfaceAlt,
                borderColor: isSelected ? colors.textPrimary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isSelected ? colors.background : colors.textSecondary },
              ]}
            >
              {group.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing['2'],
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['2'],
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  label: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
  },
});
