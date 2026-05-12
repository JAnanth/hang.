import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography';
import { RsvpRow } from '../../components/event/RsvpRow';
import { AttendeeList } from '../../components/event/AttendeeList';
import { CommentThread } from '../../components/event/CommentThread';
import { TimeVoting } from '../../components/event/TimeVoting';
import {
  useEvent,
  useEventRsvps,
  useRsvp,
  useEventComments,
  useAddComment,
  useVoteOnTime,
  useConfirmTime,
  useEndEvent,
  useAddTimeOption,
} from '../../hooks/useEvent';
import { useAuthStore } from '../../stores/authStore';
import type { RsvpStatus } from '@hang/shared';

function formatDetailTime(confirmedTime: string | null, type: string): string {
  if (type === 'quick') return 'Happening now';
  if (!confirmedTime) return 'Voting in progress';

  const date = new Date(confirmedTime);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dayLabel = isToday
    ? 'today'
    : isTomorrow
    ? 'tomorrow'
    : date.toLocaleDateString('en-US', { weekday: 'short' });

  return `${time}\n${dayLabel}`;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: event, isLoading } = useEvent(id);
  const { data: rsvps = [] } = useEventRsvps(id);
  const { data: comments = [] } = useEventComments(id);
  const { mutate: rsvp, isPending: isRsvping } = useRsvp(id);
  const { mutate: addComment, isPending: isCommenting } = useAddComment(id);
  const { mutate: vote } = useVoteOnTime(id);
  const { mutate: confirmTime } = useConfirmTime(id);
  const { mutate: endEvent, isPending: isEnding } = useEndEvent(id);
  const { mutate: addTimeOption } = useAddTimeOption(id);

  const [endModalVisible, setEndModalVisible] = useState(false);
  const [endNote, setEndNote] = useState('');

  if (isLoading || !event) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: LightColors.darkSurface }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#ffffff" />
        </View>
      </SafeAreaView>
    );
  }

  const isCreator = event.createdBy === user?.id;
  const isActive = event.status === 'active';
  const timeLabel = formatDetailTime(event.confirmedTime, event.type);
  const [timeLine1, timeLine2] = timeLabel.split('\n');

  function handleEndEvent() {
    endEvent(endNote.trim() || undefined, {
      onSuccess: () => {
        setEndModalVisible(false);
        setEndNote('');
        router.back();
      },
      onError: () => {
        Alert.alert('Error', 'Could not end the event. Please try again.');
      },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: LightColors.darkSurface }]} edges={['top']}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          {isCreator && isActive && (
            <TouchableOpacity
              onPress={() => setEndModalVisible(true)}
              style={styles.endBtn}
            >
              <Text style={styles.endBtnText}>End event</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.groupTag}>
          {event.groups[0]?.name?.toUpperCase() ?? 'GROUP'}
        </Text>

        <Text style={styles.heroTitle}>{event.title}</Text>

        <View style={styles.chipsRow}>
          {event.confirmedTime || event.type === 'quick' ? (
            <View style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <Text style={styles.chipIcon}>🕐</Text>
              <View>
                <Text style={styles.chipText}>{timeLine1}</Text>
                {timeLine2 && <Text style={styles.chipSubtext}>{timeLine2}</Text>}
              </View>
            </View>
          ) : null}

          {event.location && (
            <View style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <Text style={styles.chipIcon}>📍</Text>
              <Text style={styles.chipText}>{event.location}</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={[styles.body, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <RsvpRow
          current={event.currentUserRsvp}
          onRsvp={(status: RsvpStatus) => rsvp(status)}
          isLoading={isRsvping}
        />

        {event.type === 'voting' && !event.confirmedTime && event.timeOptions && event.timeOptions.length > 0 && (
          <TimeVoting
            options={event.timeOptions}
            onVote={(optId) => vote(optId)}
            onConfirm={isCreator ? (optId) => confirmTime(optId) : undefined}
            onSuggestTime={isActive ? (iso) => addTimeOption(iso) : undefined}
            isCreator={isCreator}
          />
        )}

        {rsvps.length > 0 && <AttendeeList rsvps={rsvps} />}

        {event.description && (
          <View style={[styles.noteBox, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.noteText, { color: colors.textPrimary }]}>{event.description}</Text>
          </View>
        )}

        <CommentThread
          comments={comments}
          onAddComment={(body) => addComment(body)}
          isSubmitting={isCommenting}
        />
      </ScrollView>

      {/* End Event Modal */}
      <Modal visible={endModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>End this event?</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              This will mark the event as ended for everyone.
            </Text>

            <TextInput
              value={endNote}
              onChangeText={setEndNote}
              placeholder="Add a closing note (optional)"
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={280}
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.surfaceAlt,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => { setEndModalVisible(false); setEndNote(''); }}
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleEndEvent}
                disabled={isEnding}
                style={[styles.modalEndBtn, { backgroundColor: colors.textPrimary }]}
              >
                {isEnding ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={[styles.modalEndText, { color: colors.background }]}>End event</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: LightColors.darkSurface,
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['3'],
    paddingBottom: Spacing['6'],
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['3'],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: '#ffffff', fontSize: FontSize.base, fontFamily: FontFamily.sans },
  endBtn: {
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['2'],
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  endBtnText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  groupTag: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    color: LightColors.accent,
    letterSpacing: 0.8,
    marginBottom: Spacing['2'],
  },
  heroTitle: {
    fontFamily: FontFamily.serifDisplay,
    fontSize: FontSize['2xl'],
    color: '#ffffff',
    lineHeight: FontSize['2xl'] * 1.25,
    marginBottom: Spacing['4'],
  },
  chipsRow: { flexDirection: 'row', gap: Spacing['2'], flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['2'],
    borderRadius: Radius.md,
  },
  chipIcon: { fontSize: FontSize.base },
  chipText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    color: '#ffffff',
  },
  chipSubtext: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  body: { flex: 1, borderTopLeftRadius: Radius.bottomSheet, borderTopRightRadius: Radius.bottomSheet },
  bodyContent: { padding: Spacing['5'], gap: Spacing['5'], paddingBottom: 40 },
  noteBox: { borderRadius: Radius.md, padding: Spacing['4'] },
  noteText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing['6'],
    gap: Spacing['4'],
  },
  modalTitle: {
    fontFamily: FontFamily.serifDisplay,
    fontSize: FontSize.xl,
  },
  modalSubtitle: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.5,
    marginTop: -Spacing['2'],
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing['3'],
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing['3'],
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing['4'],
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
  },
  modalEndBtn: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing['4'],
    alignItems: 'center',
  },
  modalEndText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
});
