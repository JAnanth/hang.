import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors.js';
import { FontFamily, FontSize, Spacing, Radius, Shadow } from '../../constants/typography.js';
import { Avatar } from '../../components/ui/Avatar.js';
import { EventCard } from '../../components/feed/EventCard.js';
import { useGroup, useLeaveGroup } from '../../hooks/useGroups.js';
import { useFeed } from '../../hooks/useFeed.js';
import { useAuthStore } from '../../stores/authStore.js';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: group, isLoading } = useGroup(id);
  const { data: events = [] } = useFeed(id);
  const { mutate: leaveGroup } = useLeaveGroup();

  const [tab, setTab] = useState<'events' | 'members'>('events');

  if (isLoading || !group) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  const handleLeave = () => {
    Alert.alert(
      `Leave ${group.name}?`,
      "You won't see events from this group anymore.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveGroup(id, { onSuccess: () => router.back() });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.textSecondary }]}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLeave}>
          <Text style={[styles.leaveText, { color: colors.textTertiary }]}>Leave</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.groupHeader}>
          <View style={[styles.groupIcon, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={styles.groupEmoji}>{group.type === 'official' ? '🏛' : '👥'}</Text>
          </View>
          <Text style={[styles.groupName, { color: colors.textPrimary }]}>{group.name}</Text>
          {group.description && (
            <Text style={[styles.groupDesc, { color: colors.textSecondary }]}>{group.description}</Text>
          )}
          <Text style={[styles.groupMeta, { color: colors.textTertiary }]}>
            {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
            {group.activeEventCount > 0 ? ` · ${group.activeEventCount} active event${group.activeEventCount !== 1 ? 's' : ''}` : ''}
          </Text>
        </View>

        <View style={styles.tabsRow}>
          {(['events', 'members'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[
                styles.tabBtn,
                tab === t && { borderBottomColor: colors.accent, borderBottomWidth: 2 },
              ]}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.textPrimary : colors.textTertiary }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'events' && (
          <View style={styles.eventsSection}>
            {events.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                No active events in this group.
              </Text>
            ) : (
              events.map((event) => (
                <EventCard key={event.id} event={{ ...event, isFeatured: false }} />
              ))
            )}
          </View>
        )}

        {tab === 'members' && (
          <View style={styles.membersSection}>
            {(group as typeof group & { members?: Array<{ id: string; userId: string; role: string; user: { name: string; avatarUrl?: string | null; isVerified: boolean } }> }).members?.map((member) => (
              <View key={member.id} style={[styles.memberRow, { borderBottomColor: colors.border }]}>
                <Avatar name={member.user.name} avatarUrl={member.user.avatarUrl} size={38} />
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: colors.textPrimary }]}>{member.user.name}</Text>
                  {member.role === 'admin' && (
                    <Text style={[styles.adminLabel, { color: colors.accent }]}>admin</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['5'],
    paddingVertical: Spacing['3'],
    borderBottomWidth: 1,
  },
  backBtn: {},
  backText: { fontFamily: FontFamily.sans, fontSize: FontSize.base },
  leaveText: { fontFamily: FontFamily.sans, fontSize: FontSize.sm },
  content: { paddingBottom: Spacing['12'] },
  groupHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing['5'],
    paddingVertical: Spacing['6'],
    gap: Spacing['2'],
  },
  groupIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2'],
  },
  groupEmoji: { fontSize: 36 },
  groupName: { fontFamily: FontFamily.serifDisplay, fontSize: FontSize.xl, textAlign: 'center' },
  groupDesc: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.5,
  },
  groupMeta: { fontFamily: FontFamily.sans, fontSize: FontSize.sm },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['5'],
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    gap: Spacing['6'],
  },
  tabBtn: {
    paddingVertical: Spacing['3'],
    paddingBottom: Spacing['3'],
  },
  tabText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  eventsSection: { padding: Spacing['4'], gap: Spacing['3'] },
  emptyText: { fontFamily: FontFamily.sans, fontSize: FontSize.base, textAlign: 'center', paddingTop: Spacing['8'] },
  membersSection: { paddingHorizontal: Spacing['5'] },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    paddingVertical: Spacing['3'],
    borderBottomWidth: 1,
  },
  memberInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing['2'] },
  memberName: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  adminLabel: { fontFamily: FontFamily.sans, fontSize: FontSize.xs },
});
