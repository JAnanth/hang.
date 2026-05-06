import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors.js';
import { FontFamily, FontSize, Spacing } from '../../constants/typography.js';
import { FeaturedCard } from '../../components/feed/FeaturedCard.js';
import { EventCard } from '../../components/feed/EventCard.js';
import { GroupFilterPills } from '../../components/feed/GroupFilterPills.js';
import { Avatar } from '../../components/ui/Avatar.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import { useFeed } from '../../hooks/useFeed.js';
import { useGroups } from '../../hooks/useGroups.js';
import type { FeedItem } from '@hang/shared';

export default function FeedScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const { user } = useAuthStore();
  const { selectedGroupFilter, setGroupFilter, openCreateSheet } = useUiStore();
  const { data: groups = [] } = useGroups();
  const { data: events = [], isLoading, refetch, isRefetching } = useFeed(selectedGroupFilter);

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.isFeatured) return <FeaturedCard event={item} />;
    return <EventCard event={item} />;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.wordmark, { color: colors.textPrimary }]}>hang.</Text>
        {user && (
          <Avatar name={user.name} avatarUrl={user.avatarUrl} size={34} />
        )}
      </View>

      <GroupFilterPills
        groups={groups}
        selected={selectedGroupFilter}
        onSelect={setGroupFilter}
      />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          testID="feed-list"
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                Nothing happening yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Be the first to plan something. Tap + to create an event.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        testID="create-fab"
        onPress={openCreateSheet}
        style={[styles.fab, { backgroundColor: colors.accent }]}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['5'],
    paddingVertical: Spacing['3'],
    borderBottomWidth: 0,
  },
  wordmark: {
    fontFamily: FontFamily.serifDisplay,
    fontSize: FontSize.xl,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: Spacing['4'], paddingTop: Spacing['3'], paddingBottom: 100 },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing['16'],
    paddingHorizontal: Spacing['8'],
    gap: Spacing['3'],
  },
  emptyTitle: {
    fontFamily: FontFamily.serifDisplay,
    fontSize: FontSize.xl,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    textAlign: 'center',
    lineHeight: FontSize.base * 1.5,
  },
  fab: {
    position: 'absolute',
    right: Spacing['5'],
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fabIcon: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: FontFamily.sansLight,
    lineHeight: 32,
    includeFontPadding: false,
  },
});
