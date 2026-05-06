import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { GoingFaces } from '../ui/GoingFaces.js';
import { FontFamily, FontSize, Spacing, Radius, Shadow } from '../../constants/typography.js';
import { LightColors } from '../../constants/colors.js';
import type { FeedItem } from '@hang/shared';

function formatEventTime(item: FeedItem): string {
  if (item.type === 'quick') return 'NOW';
  if (!item.confirmedTime) return 'Voting open';

  const date = new Date(item.confirmedTime);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `TONIGHT · ${time}`;
  if (isTomorrow) return `TOMORROW · ${time}`;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase() + ` · ${time}`;
}

interface FeaturedCardProps {
  event: FeedItem;
}

export function FeaturedCard({ event }: FeaturedCardProps) {
  const router = useRouter();
  const goingAttendees = event.rsvpCounts.going;

  return (
    <TouchableOpacity
      testID={`event-card-${event.id}`}
      activeOpacity={0.92}
      style={styles.card}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <Text style={styles.meta}>
        {event.groups[0]?.name?.toUpperCase() ?? 'GROUP'} · {formatEventTime(event)}
      </Text>
      <Text style={styles.title}>{event.title}</Text>

      {event.location && (
        <View style={styles.locationRow}>
          <Text style={styles.locationIcon}>🕐</Text>
          <Text style={styles.location}>{event.location}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <GoingFaces
          attendees={(event as FeedItem & { rsvps?: Array<{ status: string; user: { name: string; avatarUrl?: string | null } }> })?.rsvps?.filter((r: { status: string }) => r.status === 'going').map((r: { user: { name: string; avatarUrl?: string | null } }) => r.user) ?? []}
          count={goingAttendees}
          dark
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LightColors.darkSurface,
    borderRadius: Radius.lg,
    padding: Spacing['5'],
    marginBottom: Spacing['3'],
    ...(Shadow.elevated as object),
  },
  meta: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    color: LightColors.accent,
    letterSpacing: 0.8,
    marginBottom: Spacing['2'],
  },
  title: {
    fontFamily: FontFamily.serifDisplay,
    fontSize: FontSize['2xl'],
    color: '#ffffff',
    lineHeight: FontSize['2xl'] * 1.25,
    marginBottom: Spacing['3'],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing['4'],
  },
  locationIcon: {
    fontSize: FontSize.sm,
  },
  location: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.6)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
