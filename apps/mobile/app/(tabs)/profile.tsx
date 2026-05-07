import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing, Radius, Shadow } from '../../constants/typography';
import { Avatar } from '../../components/ui/Avatar';
import { useAuthStore } from '../../stores/authStore';
import { useGroups, useUpdateNotificationLevel } from '../../hooks/useGroups';
import { useLogout } from '../../hooks/useAuth';
import type { NotificationLevel } from '@hang/shared';

function NotifRow({
  groupName,
  groupId,
  level,
}: {
  groupName: string;
  groupId: string;
  level: NotificationLevel;
}) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const { mutate: updateLevel } = useUpdateNotificationLevel();

  const cycleLevel = () => {
    const next: Record<NotificationLevel, NotificationLevel> = {
      all: 'mentions',
      mentions: 'off',
      off: 'all',
    };
    updateLevel({ groupId, level: next[level] });
  };

  return (
    <TouchableOpacity
      onPress={cycleLevel}
      style={[styles.notifRow, { borderBottomColor: colors.border }]}
    >
      <Text style={[styles.notifGroup, { color: colors.textPrimary }]}>{groupName}</Text>
      <Text style={[styles.notifLevel, { color: level === 'off' ? colors.textTertiary : colors.accent }]}>
        {level === 'all' ? 'All' : level === 'mentions' ? 'Mentions' : 'Off'}
      </Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const { user } = useAuthStore();
  const { data: groups = [] } = useGroups();
  const { mutate: logout } = useLogout();

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size={72} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{user.name}</Text>
              {user.isVerified && (
                <Text style={styles.verifiedBadge}>✓</Text>
              )}
            </View>
            {user.username && (
              <Text style={[styles.username, { color: colors.textSecondary }]}>@{user.username}</Text>
            )}
            <Text style={[styles.phone, { color: colors.textTertiary }]}>{user.phone}</Text>
          </View>
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GROUPS ({groups.length})</Text>
          {groups.map((g) => (
            <View key={g.id} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.textPrimary }]}>{g.name}</Text>
              <Text style={[styles.infoValue, { color: colors.textTertiary }]}>
                {g.memberCount} members
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
          {groups.map((g) => (
            <NotifRow
              key={g.id}
              groupId={g.id}
              groupName={g.name}
              level={(g.notificationLevel as NotificationLevel) ?? 'all'}
            />
          ))}
        </View>

        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
          <TouchableOpacity
            onPress={() => logout()}
            style={[styles.logoutBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.logoutText, { color: colors.error }]}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: Spacing['5'], paddingBottom: Spacing['12'], gap: Spacing['6'] },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['4'],
    paddingTop: Spacing['5'],
  },
  profileInfo: { flex: 1, gap: Spacing['1'] },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['2'] },
  name: { fontFamily: FontFamily.serifDisplay, fontSize: FontSize.xl },
  verifiedBadge: { fontSize: FontSize.sm, color: '#c17f3b' },
  username: { fontFamily: FontFamily.sans, fontSize: FontSize.base },
  phone: { fontFamily: FontFamily.sans, fontSize: FontSize.sm },
  section: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    padding: Spacing['4'],
    paddingBottom: Spacing['2'],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    borderBottomWidth: 1,
  },
  infoLabel: { fontFamily: FontFamily.sans, fontSize: FontSize.base },
  infoValue: { fontFamily: FontFamily.sans, fontSize: FontSize.sm },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    borderBottomWidth: 1,
  },
  notifGroup: { fontFamily: FontFamily.sans, fontSize: FontSize.base },
  notifLevel: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.sm },
  logoutBtn: {
    margin: Spacing['4'],
    paddingVertical: Spacing['3'],
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  logoutText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
});
