import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors.js';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography.js';
import type { GroupWithMembership } from '@hang/shared';

interface GroupFilterPillsProps {
  groups: GroupWithMembership[];
  selected: string | null;
  onSelect: (groupId: string | null) => void;
}

export function GroupFilterPills({ groups, selected, onSelect }: GroupFilterPillsProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      <TouchableOpacity
        onPress={() => onSelect(null)}
        style={[
          styles.pill,
          {
            backgroundColor: selected === null ? colors.textPrimary : colors.surfaceAlt,
            borderColor: selected === null ? colors.textPrimary : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.pillText,
            { color: selected === null ? colors.background : colors.textSecondary },
          ]}
        >
          All
        </Text>
      </TouchableOpacity>

      {groups.map((group) => {
        const isSelected = selected === group.id;
        return (
          <TouchableOpacity
            key={group.id}
            onPress={() => onSelect(isSelected ? null : group.id)}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? colors.textPrimary : colors.surfaceAlt,
                borderColor: isSelected ? colors.textPrimary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
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
    paddingHorizontal: Spacing['4'],
    gap: Spacing['2'],
    paddingVertical: Spacing['1'],
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['2'],
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  pillText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
  },
});
