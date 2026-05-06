import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GoingFaces } from '../ui/GoingFaces.js';
import { Badge } from '../ui/Badge.js';
import { LightColors, DarkColors } from '../../constants/colors.js';
import { FontFamily, FontSize, Spacing, Radius, Shadow } from '../../constants/typography.js';
import type { FeedItem } from '@hang/shared';

function formatTime(item: FeedItem): string {
  if (item.type === 'quick') return 'NOW';
  if (!item.confirmedTime) return 'Voting open';

  const date = new Date(item.confirmedTime);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `TODAY · ${time}`;
  if (isTomorrow) return `TOMORROW · ${time}`;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
}

interface EventCardProps {
  event: FeedItem;
}

export function EventCard({ event }: EventCardProps) {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;

  return (
    <TouchableOpacity
      testID={`event-card-${event.id}`}
      activeOpacity={0.92}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, (Shadow.card as object)]}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <View style={styles.header}>
        <Text style={[styles.meta, { color: colors.accent }]}>
          {event.groups[0]?.name?.toUpperCase() ?? 'GROUP'} · {formatTime(event)}
        </Text>
        {event.type === 'quick' && <Badge label="QUICK" variant="quick" />}
        {event.type === 'voting' && !event.confirmedTime && <Badge label="VOTE" variant="accent" />}
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
        {event.title}
      </Text>

      {event.location && (
        <View style={styles.locationRow}>
          <Text style={styles.pin}>📍</Text>
          <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
            {event.location}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <GoingFaces
          attendees={[]}
          count={event.rsvpCounts.going}
        />
        {event.rsvpCounts.going === 0 && event.rsvpCounts.maybe === 0 && (
          <Text style={[styles.noRsvp, { color: colors.textTertiary }]}>Be the first to RSVP</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing['4'],
    marginBottom: Spacing['3'],
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['2'],
  },
  meta: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: FontFamily.serifDisplay,
    fontSize: FontSize.xl,
    lineHeight: FontSize.xl * 1.3,
    marginBottom: Spacing['2'],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing['3'],
  },
  pin: {
    fontSize: FontSize.sm,
  },
  location: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noRsvp: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
  },
});
