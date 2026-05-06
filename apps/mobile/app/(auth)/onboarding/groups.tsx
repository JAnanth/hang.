import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../../constants/colors.js';
import { FontFamily, FontSize, Spacing, Radius } from '../../../constants/typography.js';
import { useOfficialGroupSearch, useJoinGroup } from '../../../hooks/useGroups.js';

export default function OnboardingGroupsScreen() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [joinedIds, setJoinedIds] = useState<string[]>([]);

  const { data: results = [], isFetching } = useOfficialGroupSearch(query);
  const { mutate: joinGroup } = useJoinGroup();

  const handleJoin = (groupId: string, inviteCode: string) => {
    joinGroup(
      { groupId, inviteCode },
      {
        onSuccess: () => setJoinedIds((prev) => [...prev, groupId]),
      }
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Join your groups</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Search for your dorm floor, Greek org, club, or class group.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search groups (e.g. "Floor 3", "PKS")"
          placeholderTextColor={colors.textTertiary}
          style={[styles.search, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border }]}
          autoFocus
        />

        {isFetching && <ActivityIndicator color={colors.accent} style={styles.loader} />}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isJoined = joinedIds.includes(item.id) || item.isMember;
            return (
              <View style={[styles.groupRow, { borderColor: colors.border }]}>
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.groupMeta, { color: colors.textSecondary }]}>
                    {item.memberCount} members
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleJoin(item.id, item.inviteCode)}
                  disabled={isJoined}
                  style={[
                    styles.joinBtn,
                    { backgroundColor: isJoined ? colors.surfaceAlt : colors.textPrimary },
                  ]}
                >
                  <Text style={[styles.joinText, { color: isJoined ? colors.textTertiary : colors.background }]}>
                    {isJoined ? 'Joined' : 'Join'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
          style={styles.list}
        />

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/feed')}
          style={[styles.btn, { backgroundColor: colors.textPrimary }]}
        >
          <Text style={[styles.btnText, { color: colors.background }]}>
            {joinedIds.length > 0 ? `Continue with ${joinedIds.length} group${joinedIds.length > 1 ? 's' : ''} →` : 'Skip for now →'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Spacing['6'], paddingTop: Spacing['8'], gap: Spacing['4'] },
  title: { fontFamily: FontFamily.serifDisplay, fontSize: FontSize['2xl'] },
  subtitle: { fontFamily: FontFamily.sans, fontSize: FontSize.base, lineHeight: FontSize.base * 1.5 },
  search: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['4'],
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    borderWidth: 1,
  },
  loader: { marginTop: Spacing['2'] },
  list: { flex: 1 },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing['4'],
    borderBottomWidth: 1,
    gap: Spacing['3'],
  },
  groupInfo: { flex: 1 },
  groupName: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  groupMeta: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, marginTop: 2 },
  joinBtn: {
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['2'],
    borderRadius: Radius.pill,
  },
  joinText: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.sm },
  btn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing['4'],
    alignItems: 'center',
    marginBottom: Spacing['4'],
  },
  btnText: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.md },
});
