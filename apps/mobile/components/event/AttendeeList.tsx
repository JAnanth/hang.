import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing } from '../../constants/typography';
import type { RsvpEntry } from '@hang/shared';

interface AttendeeListProps {
  rsvps: RsvpEntry[];
}

function StatusLabel({ status, seenAt }: { status: string; seenAt: string | null }) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;

  if (status === 'going') return <Text style={[styles.statusGoing, { color: colors.accent }]}>Going</Text>;
  if (status === 'maybe') return <Text style={[styles.statusLabel, { color: colors.textTertiary }]}>Maybe</Text>;
  if (status === 'cant') return <Text style={[styles.statusLabel, { color: colors.textTertiary }]}>Can't</Text>;
  if (seenAt) return <Text style={[styles.statusLabel, { color: colors.textTertiary }]}>Seen</Text>;
  return null;
}

export function AttendeeList({ rsvps }: AttendeeListProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;

  const goingCount = rsvps.filter((r) => r.status === 'going').length;

  return (
    <View>
      <Text style={[styles.heading, { color: colors.textSecondary }]}>
        WHO'S IN ({goingCount})
      </Text>
      {rsvps.map((rsvp) => (
        <View key={rsvp.id} style={styles.row}>
          <Avatar name={rsvp.user.name} avatarUrl={rsvp.user.avatarUrl} size={38} />
          <Text style={[styles.name, { color: colors.textPrimary }]}>{rsvp.user.name}</Text>
          <View style={styles.spacer} />
          <StatusLabel status={rsvp.status} seenAt={rsvp.seenAt} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing['3'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    paddingVertical: Spacing['2'],
  },
  name: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  statusGoing: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
  },
  statusLabel: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
  },
});
