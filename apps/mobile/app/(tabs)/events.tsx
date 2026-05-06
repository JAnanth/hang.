import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LightColors, DarkColors } from '../../constants/colors.js';
import { FontFamily, FontSize, Spacing } from '../../constants/typography.js';
import { EventCard } from '../../components/feed/EventCard.js';
import { useAuthStore } from '../../stores/authStore.js';
import api from '../../lib/api.js';
import type { EventWithDetails, PaginatedResponse } from '@hang/shared';

export default function EventsScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const { user } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-events'],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<EventWithDetails>>('/events');
      return res.data.data.filter((e) => e.createdBy === user?.id);
    },
    enabled: !!user,
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Events</Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={{ ...item, isFeatured: false }} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No events yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Events you create will appear here.
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
  list: { paddingHorizontal: Spacing['4'], paddingTop: Spacing['2'], paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: Spacing['16'], gap: Spacing['2'] },
  emptyTitle: { fontFamily: FontFamily.serifDisplay, fontSize: FontSize.lg },
  emptyText: { fontFamily: FontFamily.sans, fontSize: FontSize.base, textAlign: 'center' },
});
