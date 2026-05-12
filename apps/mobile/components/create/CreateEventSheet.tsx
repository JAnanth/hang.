import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  FlatList,
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

// ─── Time picker modal (reused for planned date/time and voting slot picks) ──

const DAYS = (() => {
  const days: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
})();

const TIME_SLOTS = (() => {
  const slots: { label: string; hour: number; minute: number }[] = [];
  for (let h = 6; h < 24; h++) {
    for (const m of [0, 30]) {
      const ampm = h < 12 ? 'AM' : 'PM';
      const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
      slots.push({ label: `${dh}:${m === 0 ? '00' : '30'} ${ampm}`, hour: h, minute: m });
    }
  }
  return slots;
})();

function formatDay(d: Date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tom = new Date(today); tom.setDate(tom.getDate() + 1);
  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === tom.getTime()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDateLabel(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTimeLabel(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function makeDefaultDate() {
  const d = new Date(); d.setHours(d.getHours() + 2, 0, 0, 0); return d;
}

type PickerStep = 'date' | 'time' | null;

interface PickerModalProps {
  visible: boolean;
  step: PickerStep;
  date: Date;
  onSelectDate: (d: Date) => void;
  onSelectTime: (h: number, m: number) => void;
  onClose: () => void;
  colors: typeof LightColors;
}

function TimePickerModal({ visible, step, date, onSelectDate, onSelectTime, onClose, colors }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[pickerStyles.card, { backgroundColor: colors.surface }]}>
        <View style={[pickerStyles.header, { borderBottomColor: colors.border }]}>
          <Text style={[pickerStyles.title, { color: colors.textSecondary }]}>
            {step === 'date' ? 'Pick a day' : 'Pick a time'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[pickerStyles.done, { color: colors.accent }]}>Done</Text>
          </TouchableOpacity>
        </View>
        {step === 'date' ? (
          <FlatList
            data={DAYS}
            keyExtractor={(d) => d.toISOString()}
            contentContainerStyle={pickerStyles.listContent}
            renderItem={({ item: d }) => {
              const sel = d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
              return (
                <TouchableOpacity
                  onPress={() => onSelectDate(d)}
                  style={[pickerStyles.row, { borderBottomColor: colors.border }, sel && { backgroundColor: colors.surfaceAlt }]}
                >
                  <Text style={[pickerStyles.rowText, { color: sel ? colors.accent : colors.textPrimary }]}>{formatDay(d)}</Text>
                  {sel && <Text style={{ color: colors.accent }}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <FlatList
            data={TIME_SLOTS}
            keyExtractor={(s) => s.label}
            contentContainerStyle={pickerStyles.listContent}
            getItemLayout={(_, i) => ({ length: 48, offset: 48 * i, index: i })}
            initialScrollIndex={Math.max(0, TIME_SLOTS.findIndex((s) => s.hour === date.getHours() && s.minute === date.getMinutes()))}
            renderItem={({ item: s }) => {
              const sel = s.hour === date.getHours() && s.minute === date.getMinutes();
              return (
                <TouchableOpacity
                  onPress={() => onSelectTime(s.hour, s.minute)}
                  style={[pickerStyles.row, { borderBottomColor: colors.border }, sel && { backgroundColor: colors.surfaceAlt }]}
                >
                  <Text style={[pickerStyles.rowText, { color: sel ? colors.accent : colors.textPrimary }]}>{s.label}</Text>
                  {sel && <Text style={{ color: colors.accent }}>✓</Text>}
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  card: { height: '55%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing['5'], paddingVertical: Spacing['3'], borderBottomWidth: 1 },
  title: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  done: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.base },
  listContent: { paddingBottom: 40 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing['5'], paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, height: 48 },
  rowText: { fontFamily: FontFamily.sans, fontSize: FontSize.base },
});

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, colors }: { label: string; colors: typeof LightColors }) {
  return <Text style={[sheetStyles.sectionLabel, { color: colors.textTertiary }]}>{label}</Text>;
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
  const [plannedDate, setPlannedDate] = useState<Date>(makeDefaultDate);
  const [pickerStep, setPickerStep] = useState<PickerStep>(null);
  const [pickerTarget, setPickerTarget] = useState<'planned' | number>('planned');

  // Voting timing — array of Date objects (no auto-populate)
  const [voteSlots, setVoteSlots] = useState<Date[]>([]);
  // Slot being edited in the picker (-1 = new)
  const [editingSlot, setEditingSlot] = useState<number>(-1);
  const [slotDraft, setSlotDraft] = useState<Date>(makeDefaultDate);

  const selectedGroups = groups.filter((g) => selectedGroupIds.includes(g.id));
  const primaryGroup = selectedGroups[0];
  const totalInvited = selectedGroups.reduce((sum, g) => sum + g.memberCount, 0);

  // Voting requires ≥ 2 slots
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

  // ── Planned pickers ──
  const openPlannedDate = () => { setPickerTarget('planned'); setPickerStep('date'); };
  const openPlannedTime = () => { setPickerTarget('planned'); setPickerStep('time'); };

  // ── Vote slot pickers ──
  const openNewSlot = () => {
    setSlotDraft(makeDefaultDate());
    setEditingSlot(-1);
    setPickerTarget('planned'); // reuse flow but for slotDraft
    setPickerStep('date');
  };

  const handlePickerDate = (d: Date) => {
    if (pickerTarget === 'planned') {
      const next = new Date(d);
      next.setHours(plannedDate.getHours(), plannedDate.getMinutes(), 0, 0);
      setPlannedDate(next);
      setPickerStep('time');
    } else {
      const next = new Date(d);
      next.setHours(slotDraft.getHours(), slotDraft.getMinutes(), 0, 0);
      setSlotDraft(next);
      setPickerStep('time');
    }
  };

  const handlePickerTime = (h: number, m: number) => {
    if (pickerTarget === 'planned') {
      const next = new Date(plannedDate);
      next.setHours(h, m, 0, 0);
      setPlannedDate(next);
    } else {
      const next = new Date(slotDraft);
      next.setHours(h, m, 0, 0);
      // Commit the slot
      if (editingSlot === -1) {
        setVoteSlots((prev) => [...prev, next]);
      } else {
        setVoteSlots((prev) => prev.map((s, i) => (i === editingSlot ? next : s)));
      }
      setSlotDraft(next);
    }
    setPickerStep(null);
  };

  const editVoteSlot = (index: number) => {
    setSlotDraft(voteSlots[index]);
    setEditingSlot(index);
    setPickerTarget(index);
    setPickerStep('date');
  };

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
        setSelectedGroupIds([]); setPlannedDate(makeDefaultDate()); setVoteSlots([]);
        setErrorMsg(null);
        closeCreateSheet();
      },
      onError: (err: unknown) => {
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      },
    });
  };

  // Whether the picker applies to planned vs vote slot
  const isSlotPicker = pickerTarget !== 'planned';
  const pickerDate = isSlotPicker ? slotDraft : plannedDate;

  return (
    <>
      <BottomSheet visible={isCreateSheetOpen} onClose={closeCreateSheet}>
        <ScrollView style={sheetStyles.scroll} contentContainerStyle={sheetStyles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
          <LocationInput
            value={location}
            onChange={setLocation}
            colors={colors}
          />

          <SectionLabel label="TIMING" colors={colors} />
          <TimingToggle selected={type} onSelect={setType} />

          {type === 'planned' && (
            <View style={sheetStyles.timeRow}>
              <TouchableOpacity onPress={openPlannedDate} style={[sheetStyles.timeChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[sheetStyles.timeChipText, { color: colors.textPrimary }]}>{formatDateLabel(plannedDate)}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={openPlannedTime} style={[sheetStyles.timeChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[sheetStyles.timeChipText, { color: colors.textPrimary }]}>{formatTimeLabel(plannedDate)}</Text>
              </TouchableOpacity>
            </View>
          )}

          {type === 'voting' && (
            <View style={sheetStyles.votingSection}>
              <Text style={[sheetStyles.votingHint, { color: colors.textTertiary }]}>
                Add times for people to vote on. Attendees can also suggest new times.
              </Text>
              {voteSlots.map((slot, i) => (
                <View key={i} style={[sheetStyles.slotRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <TouchableOpacity style={sheetStyles.slotLabel} onPress={() => editVoteSlot(i)}>
                    <Text style={[sheetStyles.slotDay, { color: colors.textPrimary }]}>{formatDateLabel(slot)}</Text>
                    <Text style={[sheetStyles.slotTime, { color: colors.textSecondary }]}>{formatTimeLabel(slot)}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeVoteSlot(i)} style={sheetStyles.slotRemove}>
                    <Text style={[sheetStyles.slotRemoveText, { color: colors.textTertiary }]}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {voteSlots.length < 4 && (
                <TouchableOpacity onPress={openNewSlot} style={[sheetStyles.addSlotBtn, { borderColor: colors.border }]}>
                  <Text style={[sheetStyles.addSlotText, { color: colors.accent }]}>+ Add a time option</Text>
                </TouchableOpacity>
              )}
              {voteSlots.length > 0 && voteSlots.length < 2 && (
                <Text style={[sheetStyles.votingHint, { color: colors.error }]}>Add at least 2 times to send.</Text>
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

      <TimePickerModal
        visible={pickerStep !== null}
        step={pickerStep}
        date={pickerDate}
        onSelectDate={handlePickerDate}
        onSelectTime={handlePickerTime}
        onClose={() => setPickerStep(null)}
        colors={colors}
      />
    </>
  );
}

const sheetStyles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing['5'], paddingBottom: Spacing['4'], gap: Spacing['3'] },
  heading: { fontFamily: FontFamily.serifDisplay, fontSize: FontSize['2xl'], marginBottom: Spacing['2'], marginTop: Spacing['2'] },
  sectionLabel: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.xs, letterSpacing: 0.8, marginTop: Spacing['2'] },
  input: { borderRadius: Radius.md, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], fontFamily: FontFamily.sans, fontSize: FontSize.base },
  noteInput: { minHeight: 80, textAlignVertical: 'top' },
  inviteCount: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, marginTop: -Spacing['1'] },
  timeRow: { flexDirection: 'row', gap: Spacing['3'] },
  timeChip: { flex: 1, paddingVertical: Spacing['3'], paddingHorizontal: Spacing['4'], borderRadius: Radius.md, borderWidth: 1, alignItems: 'center' },
  timeChipText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  votingSection: { gap: Spacing['2'] },
  votingHint: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, lineHeight: FontSize.sm * 1.4 },
  slotRow: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: 1 },
  slotLabel: { flex: 1, padding: Spacing['3'] },
  slotDay: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  slotTime: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, marginTop: 2 },
  slotRemove: { padding: Spacing['3'] },
  slotRemoveText: { fontSize: FontSize.base },
  addSlotBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: Radius.md, paddingVertical: Spacing['3'], alignItems: 'center' },
  addSlotText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  errorBox: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing['4'], paddingVertical: Spacing['3'], backgroundColor: '#fef2f2', borderColor: '#fca5a5' },
  errorText: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, color: '#dc2626' },
  footer: { paddingHorizontal: Spacing['5'], paddingTop: Spacing['4'], borderTopWidth: 1 },
  submitBtn: { borderRadius: Radius.lg, paddingVertical: Spacing['4'], alignItems: 'center' },
  submitText: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.md },
});
