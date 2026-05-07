import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing, Radius, Shadow } from '../../constants/typography';
import { useGroups } from '../../hooks/useGroups';
import type { GroupWithMembership } from '@hang/shared';

function GroupRow({ group }: { group: GroupWithMembership }) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  return (
    <TouchableOpacity
      testID={`group-row-${group.id}`}
      onPress={() => router.push(`/groups/${group.id}`)}
      style={[styles.groupCard, { backgroundColor: colors.surface, borderColor: colors.border }, (Shadow.card as object)]}
      activeOpacity={0.85}
    >
      <View style={[styles.groupAvatar, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={styles.groupEmoji}>
          {group.type === 'official' ? '🏛' : '👥'}
        </Text>
      </View>

      <View style={styles.groupInfo}>
        <Text style={[styles.groupName, { color: colors.textPrimary }]}>{group.name}</Text>
        <Text style={[styles.groupMeta, { color: colors.textSecondary }]}>
          {group.memberCount} member{group.memberCount !== 1 ? 's' : ''}
          {group.activeEventCount > 0
            ? ` · ${group.activeEventCount} active event${group.activeEventCount !== 1 ? 's' : ''}`
            : ''}
        </Text>
      </View>

      {group.activeEventCount > 0 ? (
        <View style={[styles.badge, { backgroundColor: colors.accent }]}>
          <Text style={styles.badgeText}>{group.activeEventCount}</Text>
        </View>
      ) : (
        <Text style={[styles.chevron, { color: colors.textTertiary }]}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export default function GroupsScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const { data: groups = [], isLoading, refetch, isRefetching } = useGroups();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Your groups</Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <GroupRow group={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListFooterComponent={
            <TouchableOpacity
              onPress={() => router.push('/(auth)/onboarding/groups')}
              style={[styles.createBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.createText, { color: colors.textSecondary }]}>
                + Create or join a group
              </Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No groups yet
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Join official Berkeley groups or create your own.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: Spacing['5'], paddingVertical: Spacing['4'] },
  title: { fontFamily: FontFamily.serifDisplay, fontSize: FontSize.xl },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing['4'], paddingTop: Spacing['2'], paddingBottom: 100, gap: Spacing['3'] },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['4'],
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing['3'],
  },
  groupAvatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupEmoji: { fontSize: 26 },
  groupInfo: { flex: 1 },
  groupName: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.base },
  groupMeta: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, marginTop: 2 },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.xs, color: '#ffffff' },
  chevron: { fontSize: FontSize.lg },
  createBtn: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: Spacing['4'],
    alignItems: 'center',
    marginTop: Spacing['2'],
  },
  createText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  empty: { alignItems: 'center', paddingTop: Spacing['16'], gap: Spacing['2'] },
  emptyTitle: { fontFamily: FontFamily.serifDisplay, fontSize: FontSize.lg },
  emptyText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    textAlign: 'center',
    paddingHorizontal: Spacing['8'],
  },
});
