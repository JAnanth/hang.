import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { BottomSheet } from '../ui/BottomSheet';
import { TimingToggle } from './TimingToggle';
import { GroupMultiSelect } from './GroupMultiSelect';
import { LocationInput } from './LocationInput';
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography';
import { useGroups } from '../../hooks/useGroups';
import { useCreateEvent } from '../../hooks/useEvent';
import { useUiStore } from '../../stores/uiStore';
import type { EventType } from '@hang/shared';

// ─── Compact date+time picker ─────────────────────────────────────────────────

const PICKER_DAYS = (() => {
  const days: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
})();

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 15, 30, 45];

function dayChipLabel(d: Date): { top: string; bottom: string } {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { top: 'Today', bottom: '' };
  if (diff === 1) return { top: 'Tomorrow', bottom: '' };
  return {
    top: d.toLocaleDateString('en-US', { weekday: 'short' }),
    bottom: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}

function buildIso(day: Date, hour: number, minute: number, ampm: 'AM' | 'PM'): string {
  const d = new Date(day);
  let h = hour % 12;
  if (ampm === 'PM') h += 12;
  d.setHours(h, minute, 0, 0);
  return d.toISOString();
}

interface CompactTimePickerProps {
  initialDate?: Date;
  title: string;
  onSelect: (iso: string) => void;
  onCancel: () => void;
  colors: typeof LightColors;
}

function CompactTimePicker({ initialDate, title, onSelect, onCancel, colors }: CompactTimePickerProps) {
  const init = initialDate ?? (() => { const d = new Date(); d.setHours(18, 0, 0, 0); return d; })();
  const initHour = init.getHours() % 12 || 12;
  const initAmpm: 'AM' | 'PM' = init.getHours() < 12 ? 'AM' : 'PM';
  const initMinute = Math.round(init.getMinutes() / 15) * 15 % 60;

  const [selDay, setSelDay] = useState<Date>(
    PICKER_DAYS.find((d) => d.toDateString() === init.toDateString()) ?? PICKER_DAYS[0]
  );
  const [selHour, setSelHour] = useState(initHour);
  const [selMinute, setSelMinute] = useState(initMinute);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initAmpm);

  const previewIso = buildIso(selDay, selHour, selMinute, ampm);
  const isInFuture = new Date(previewIso) > new Date();

  return (
    <View style={[pickerStyles.sheet, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[pickerStyles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={[pickerStyles.action, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[pickerStyles.title, { color: colors.textPrimary }]}>{title}</Text>
        <TouchableOpacity onPress={() => isInFuture && onSelect(previewIso)} disabled={!isInFuture}>
          <Text style={[pickerStyles.action, pickerStyles.actionBold, { color: isInFuture ? colors.accent : colors.border }]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>

      {/* Date row */}
      <Text style={[pickerStyles.sectionLabel, { color: colors.textSecondary }]}>DATE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pickerStyles.dayRow}>
        {PICKER_DAYS.map((d) => {
          const label = dayChipLabel(d);
          const selected = d.toDateString() === selDay.toDateString();
          return (
            <TouchableOpacity
              key={d.toISOString()}
              onPress={() => setSelDay(d)}
              style={[
                pickerStyles.dayChip,
                { borderColor: selected ? colors.accent : colors.border },
                selected && { backgroundColor: `${colors.accent}18` },
              ]}
            >
              <Text style={[pickerStyles.dayTop, { color: selected ? colors.accent : colors.textPrimary }]}>
                {label.top}
              </Text>
              {label.bottom ? (
                <Text style={[pickerStyles.dayBottom, { color: selected ? colors.accent : colors.textSecondary }]}>
                  {label.bottom}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Hour grid */}
      <Text style={[pickerStyles.sectionLabel, { color: colors.textSecondary }]}>HOUR</Text>
      <View style={pickerStyles.hourGrid}>
        {HOURS.map((h) => {
          const selected = h === selHour;
          return (
            <TouchableOpacity
              key={h}
              onPress={() => setSelHour(h)}
              style={[
                pickerStyles.hourCell,
                { borderColor: selected ? colors.accent : colors.border },
                selected && { backgroundColor: `${colors.accent}18` },
              ]}
            >
              <Text style={[pickerStyles.hourText, { color: selected ? colors.accent : colors.textPrimary }]}>
                {h}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Minute + AM/PM */}
      <View style={pickerStyles.minuteRow}>
        <View style={pickerStyles.minuteGroup}>
          {MINUTES.map((m) => {
            const selected = m === selMinute;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setSelMinute(m)}
                style={[
                  pickerStyles.minuteChip,
                  { borderColor: selected ? colors.accent : colors.border },
                  selected && { backgroundColor: `${colors.accent}18` },
                ]}
              >
                <Text style={[pickerStyles.minuteText, { color: selected ? colors.accent : colors.textPrimary }]}>
                  :{String(m).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={[pickerStyles.ampmToggle, { borderColor: colors.border }]}>
          {(['AM', 'PM'] as const).map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => setAmpm(a)}
              style={[pickerStyles.ampmBtn, ampm === a && { backgroundColor: colors.accent }]}
            >
              <Text style={[pickerStyles.ampmText, { color: ampm === a ? '#fff' : colors.textSecondary }]}>
                {a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preview */}
      {isInFuture && (
        <Text style={[pickerStyles.preview, { color: colors.textSecondary }]}>
          {new Date(previewIso).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit',
          })}
        </Text>
      )}
      {!isInFuture && (
        <Text style={[pickerStyles.preview, { color: colors.error ?? '#c0392b' }]}>
          Please choose a future time
        </Text>
      )}
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['5'],
    paddingVertical: Spacing['4'],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.base },
  action: { fontFamily: FontFamily.sans, fontSize: FontSize.base },
  actionBold: { fontFamily: FontFamily.sansSemiBold },
  sectionLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginTop: Spacing['4'],
    marginBottom: Spacing['2'],
    paddingHorizontal: Spacing['5'],
  },
  dayRow: { paddingHorizontal: Spacing['5'], gap: Spacing['2'] },
  dayChip: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['2'],
    alignItems: 'center',
    minWidth: 72,
  },
  dayTop: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.sm },
  dayBottom: { fontFamily: FontFamily.sans, fontSize: FontSize.xs, marginTop: 2 },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing['5'],
    gap: Spacing['2'],
  },
  hourCell: {
    width: '21%',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing['2'],
    alignItems: 'center',
  },
  hourText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  minuteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['5'],
    marginTop: Spacing['4'],
    gap: Spacing['3'],
  },
  minuteGroup: { flexDirection: 'row', gap: Spacing['2'] },
  minuteChip: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['2'],
  },
  minuteText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  ampmToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: Radius.md, overflow: 'hidden' },
  ampmBtn: { paddingHorizontal: Spacing['4'], paddingVertical: Spacing['2'] },
  ampmText: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.base },
  preview: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing['4'],
    paddingHorizontal: Spacing['5'],
  },
});

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, colors }: { label: string; colors: typeof LightColors }) {
  return <Text style={[sheetStyles.sectionLabel, { color: colors.textTertiary }]}>{label}</Text>;
}

function formatDateLabel(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTimeLabel(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ─── CreateEventSheet ─────────────────────────────────────────────────────────

export function CreateEventSheet() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const { isCreateSheetOpen, closeCreateSheet } = useUiStore();
  const { data: groups = [] } = useGroups();
  const { mutate: createEvent, isPending } = useCreateEvent();

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<EventType>('planned');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Planned timing
  const [plannedDate, setPlannedDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(d.getHours() + 2, 0, 0, 0); return d;
  });

  // Voting timing
  const [voteSlots, setVoteSlots] = useState<Date[]>([]);

  // Picker state — null = closed, 'planned' = editing plannedDate, number = editing slot index, -1 = new slot
  const [pickerTarget, setPickerTarget] = useState<'planned' | number | null>(null);

  const selectedGroups = groups.filter((g) => selectedGroupIds.includes(g.id));
  const primaryGroup = selectedGroups[0];
  const totalInvited = selectedGroups.reduce((sum, g) => sum + g.memberCount, 0);

  const canSubmit =
    title.trim().length > 0 &&
    selectedGroupIds.length > 0 &&
    !isPending &&
    (type !== 'voting' || voteSlots.length >= 2);

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  function handlePickerSelect(iso: string) {
    const d = new Date(iso);
    if (pickerTarget === 'planned') {
      setPlannedDate(d);
    } else if (pickerTarget === -1) {
      setVoteSlots((prev) => [...prev, d]);
    } else if (typeof pickerTarget === 'number') {
      setVoteSlots((prev) => prev.map((s, i) => (i === pickerTarget ? d : s)));
    }
    setPickerTarget(null);
  }

  const removeVoteSlot = (index: number) => {
    setVoteSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setErrorMsg(null);

    const payload = {
      title: title.trim(),
      location: location.trim() || undefined,
      description: note.trim() || undefined,
      type,
      groupIds: selectedGroupIds,
      ...(type === 'planned' ? { confirmedTime: plannedDate.toISOString() } : {}),
      ...(type === 'voting' ? { timeOptions: voteSlots.map((d) => d.toISOString()) } : {}),
    };

    createEvent(payload, {
      onSuccess: () => {
        setTitle(''); setLocation(''); setNote(''); setType('planned');
        setSelectedGroupIds([]); setVoteSlots([]); setErrorMsg(null);
        const d = new Date(); d.setHours(d.getHours() + 2, 0, 0, 0);
        setPlannedDate(d);
        closeCreateSheet();
      },
      onError: (err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      },
    });
  };

  const pickerInitialDate =
    pickerTarget === 'planned'
      ? plannedDate
      : typeof pickerTarget === 'number' && pickerTarget >= 0
      ? voteSlots[pickerTarget]
      : undefined;

  const pickerTitle =
    pickerTarget === 'planned'
      ? 'Set date & time'
      : pickerTarget === -1
      ? 'Add a time option'
      : 'Edit time option';

  return (
    <>
      <BottomSheet visible={isCreateSheetOpen} onClose={closeCreateSheet}>
        <ScrollView
          style={sheetStyles.scroll}
          contentContainerStyle={sheetStyles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[sheetStyles.heading, { color: colors.textPrimary }]}>New event</Text>

          {errorMsg && (
            <View style={sheetStyles.errorBox}>
              <Text style={sheetStyles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <SectionLabel label="WHAT'S THE PLAN?" colors={colors} />
          <TextInput
            testID="event-title-input"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Pickup basketball 🏀"
            placeholderTextColor={colors.textTertiary}
            style={[sheetStyles.input, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary }]}
            maxLength={type === 'quick' ? 60 : 200}
            returnKeyType="next"
            autoFocus
          />

          <SectionLabel label="SEND TO" colors={colors} />
          <GroupMultiSelect groups={groups} selected={selectedGroupIds} onToggle={toggleGroup} />
          {selectedGroupIds.length > 0 && (
            <Text style={[sheetStyles.inviteCount, { color: colors.textTertiary }]}>
              {totalInvited} {totalInvited === 1 ? 'person' : 'people'} will be notified
            </Text>
          )}

          <SectionLabel label="LOCATION" colors={colors} />
          <LocationInput value={location} onChange={setLocation} colors={colors} />

          <SectionLabel label="TIMING" colors={colors} />
          <TimingToggle selected={type} onSelect={setType} />

          {type === 'planned' && (
            <TouchableOpacity
              onPress={() => setPickerTarget('planned')}
              style={[sheetStyles.timeRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
            >
              <Text style={[sheetStyles.timeChipText, { color: colors.textPrimary }]}>
                {formatDateLabel(plannedDate)}
              </Text>
              <Text style={[sheetStyles.timeChipDot, { color: colors.textSecondary }]}>·</Text>
              <Text style={[sheetStyles.timeChipText, { color: colors.textPrimary }]}>
                {formatTimeLabel(plannedDate)}
              </Text>
            </TouchableOpacity>
          )}

          {type === 'voting' && (
            <View style={sheetStyles.votingSection}>
              <Text style={[sheetStyles.votingHint, { color: colors.textTertiary }]}>
                Add times for people to vote on. Attendees can also suggest new times.
              </Text>
              {voteSlots.map((slot, i) => (
                <View
                  key={i}
                  style={[sheetStyles.slotRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                >
                  <TouchableOpacity style={sheetStyles.slotLabel} onPress={() => setPickerTarget(i)}>
                    <Text style={[sheetStyles.slotDay, { color: colors.textPrimary }]}>{formatDateLabel(slot)}</Text>
                    <Text style={[sheetStyles.slotTime, { color: colors.textSecondary }]}>{formatTimeLabel(slot)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeVoteSlot(i)} style={sheetStyles.slotRemove}>
                    <Text style={[sheetStyles.slotRemoveText, { color: colors.textTertiary }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {voteSlots.length < 4 && (
                <TouchableOpacity
                  onPress={() => setPickerTarget(-1)}
                  style={[sheetStyles.addSlotBtn, { borderColor: colors.border }]}
                >
                  <Text style={[sheetStyles.addSlotText, { color: colors.accent }]}>+ Add a time option</Text>
                </TouchableOpacity>
              )}
              {voteSlots.length === 1 && (
                <Text style={[sheetStyles.votingHint, { color: colors.error }]}>
                  Add at least 2 times to send.
                </Text>
              )}
            </View>
          )}

          <SectionLabel label="NOTE" colors={colors} />
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Add a note… (optional)"
            placeholderTextColor={colors.textTertiary}
            style={[sheetStyles.input, sheetStyles.noteInput, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary }]}
            multiline
            numberOfLines={3}
            returnKeyType="done"
          />
        </ScrollView>

        <View style={[sheetStyles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            testID="create-event-submit"
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[sheetStyles.submitBtn, { backgroundColor: canSubmit ? colors.textPrimary : colors.border }]}
          >
            <Text style={[sheetStyles.submitText, { color: canSubmit ? colors.background : colors.textTertiary }]}>
              {isPending
                ? 'Sending…'
                : primaryGroup
                ? `Send to ${primaryGroup.name}${selectedGroupIds.length > 1 ? ` +${selectedGroupIds.length - 1}` : ''} →`
                : 'Send →'}
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Compact date+time picker */}
      <Modal visible={pickerTarget !== null} animationType="slide" transparent>
        <View style={sheetStyles.modalOverlay}>
          {pickerTarget !== null && (
            <CompactTimePicker
              key={String(pickerTarget)}
              initialDate={pickerInitialDate}
              title={pickerTitle}
              colors={colors}
              onCancel={() => setPickerTarget(null)}
              onSelect={handlePickerSelect}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const sheetStyles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing['5'], paddingBottom: Spacing['4'], gap: Spacing['3'] },
  heading: {
    fontFamily: FontFamily.serifDisplay,
    fontSize: FontSize['2xl'],
    marginBottom: Spacing['2'],
    marginTop: Spacing['2'],
  },
  sectionLabel: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.xs, letterSpacing: 0.8, marginTop: Spacing['2'] },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
  },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  inviteCount: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, marginTop: -Spacing['1'] },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  timeChipText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  timeChipDot: { fontFamily: FontFamily.sans, fontSize: FontSize.base },
  votingSection: { gap: Spacing['2'] },
  votingHint: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, lineHeight: FontSize.sm * 1.4 },
  slotRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1 },
  slotLabel: { flex: 1, padding: Spacing['3'] },
  slotDay: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  slotTime: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, marginTop: 2 },
  slotRemove: { padding: Spacing['3'] },
  slotRemoveText: { fontSize: FontSize.base },
  addSlotBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: Spacing['3'],
    alignItems: 'center',
  },
  addSlotText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  errorBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  errorText: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, color: '#dc2626' },
  footer: { paddingHorizontal: Spacing['5'], paddingTop: Spacing['4'], borderTopWidth: 1 },
  submitBtn: { borderRadius: Radius.lg, paddingVertical: Spacing['4'], alignItems: 'center' },
  submitText: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.md },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
});
