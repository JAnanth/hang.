import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from './Avatar.js';
import { FontFamily, FontSize } from '../../constants/typography.js';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors.js';

interface GoingFacesProps {
  attendees: Array<{ name: string; avatarUrl?: string | null }>;
  count: number;
  dark?: boolean;
}

export function GoingFaces({ attendees, count, dark = false }: GoingFacesProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const shown = attendees.slice(0, 4);
  const textColor = dark ? '#ffffff' : colors.textSecondary;

  return (
    <View style={styles.row}>
      <View style={styles.faces}>
        {shown.map((a, i) => (
          <View key={i} style={[styles.faceWrapper, { marginLeft: i === 0 ? 0 : -8 }]}>
            <Avatar name={a.name} avatarUrl={a.avatarUrl} size={28} />
          </View>
        ))}
      </View>
      {count > 0 && (
        <Text style={[styles.label, { color: textColor }]}>
          {count === 1 ? '1 going' : `+${count > 4 ? count - 4 : count} going`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  faces: {
    flexDirection: 'row',
  },
  faceWrapper: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  label: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
  },
});
