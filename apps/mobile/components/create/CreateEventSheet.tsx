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
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography';
import { useGroups } from '../../hooks/useGroups';
import { useCreateEvent } from '../../hooks/useEvent';
import { useUiStore } from '../../stores/uiStore';
import type { EventType } from '@hang/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDefaultDate() {
  const d = new Date();
  d.setHours(d.getHours() + 2, 0, 0, 0);
  return d;
}

/** Next 14 days starting today */
function buildDays(): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

/** 30-minute slots from 6 AM to 11:30 PM */
function buildTimeSlots(): { label: string; hour: number; minute: number }[] {
  const slots = [];
  for (let h = 6; h < 24; h++) {
    for (const m of [0, 30]) {
      const ampm = h < 12 ? 'AM' : 'PM';
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      const displayM = m === 0 ? '00' : '30';
      slots.push({ label: `${displayH}:${displayM} ${ampm}`, hour: h, minute: m });
    }
  }
  return slots;
}

const DAYS = buildDays();
const TIME_SLOTS = buildTimeSlots();

function formatDay(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return 'Today';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDate(d: Date) {
  return formatDay(d);
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// ─── Picker modal ────────────────────────────────────────────────────────────

type PickerType = 'date' | 'time';

interface PickerModalProps {
  visible: boolean;
  type: PickerType;
  date: Date;
  onSelectDate: (d: Date) => void;
  onSelectTime: (hour: number, minute: number) => void;
  onClose: () => void;
  colors: typeof LightColors;
}

function PickerModal({ visible, type, date, onSelectDate, onSelectTime, onClose, colors }: PickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[pickerStyles.card, { backgroundColor: colors.surface }]}>
        <View style={[pickerStyles.header, { borderBottomColor: colors.border }]}>
          <Text style={[pickerStyles.headerTitle, { color: colors.textSecondary }]}>
            {type === 'date' ? 'Pick a day' : 'Pick a time'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[pickerStyles.doneBtn, { color: colors.accent }]}>Done</Text>
          </TouchableOpacity>
        </View>
        {type === 'date' ? (
          <FlatList
            data={DAYS}
            keyExtractor={(d) => d.toISOString()}
            contentContainerStyle={pickerStyles.listContent}
            renderItem={({ item: d }) => {
              const selected =
                d.getFullYear() === date.getFullYear() &&
                d.getMonth() === date.getMonth() &&
                d.getDate() === date.getDate();
              return (
                <TouchableOpacity
                  onPress={() => { onSelectDate(d); onClose(); }}
                  style={[
                    pickerStyles.row,
                    { borderBottomColor: colors.border },
                    selected && { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <Text style={[pickerStyles.rowText, { color: selected ? colors.accent : colors.textPrimary }]}>
                    {formatDay(d)}
                  </Text>
                  {selected && <Text style={{ color: colors.accent }}>✓</Text>}
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
            initialScrollIndex={Math.max(
              0,
              TIME_SLOTS.findIndex((s) => s.hour === date.getHours() && s.minute === date.getMinutes())
            )}
            renderItem={({ item: s }) => {
              const selected = s.hour === date.getHours() && s.minute === date.getMinutes();
              return (
                <TouchableOpacity
                  onPress={() => { onSelectTime(s.hour, s.minute); onClose(); }}
                  style={[
                    pickerStyles.row,
                    { borderBottomColor: colors.border },
                    selected && { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <Text style={[pickerStyles.rowText, { color: selected ? colors.accent : colors.textPrimary }]}>
                    {s.label}
                  </Text>
                  {selected && <Text style={{ color: colors.accent }}>✓</Text>}
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    height: '55%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['5'],
    paddingVertical: Spacing['3'],
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
  },
  doneBtn: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['5'],
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: 48,
  },
  rowText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
  },
});

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, colors }: { label: string; colors: typeof LightColors }) {
  return (
    <Text style={[sheetStyles.sectionLabel, { color: colors.textTertiary }]}>{label}</Text>
  );
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
  const [date, setDate] = useState<Date>(makeDefaultDate);
  const [activePicker, setActivePicker] = useState<PickerType | null>(null);

  const [timeOptions] = useState<string[]>([
    new Date(Date.now() + 3600 * 1000).toISOString(),
    new Date(Date.now() + 7200 * 1000).toISOString(),
  ]);

  const primaryGroup = groups.find((g) => selectedGroupIds[0] === g.id);
  const canSubmit = title.trim().length > 0 && selectedGroupIds.length > 0 && !isPending;

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleSelectDate = (d: Date) => {
    const next = new Date(d);
    next.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setDate(next);
  };

  const handleSelectTime = (hour: number, minute: number) => {
    const next = new Date(date);
    next.setHours(hour, minute, 0, 0);
    setDate(next);
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
      ...(type === 'planned' ? { confirmedTime: date.toISOString() } : {}),
      ...(type === 'voting' ? { timeOptions } : {}),
    };

    createEvent(payload, {
      onSuccess: () => {
        setTitle('');
        setLocation('');
        setNote('');
        setType('planned');
        setSelectedGroupIds([]);
        setDate(makeDefaultDate());
        setErrorMsg(null);
        closeCreateSheet();
      },
      onError: (err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setErrorMsg(message);
      },
    });
  };

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

          <SectionLabel label="LOCATION" colors={colors} />
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Where? (optional)"
            placeholderTextColor={colors.textTertiary}
            style={[sheetStyles.input, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary }]}
            returnKeyType="next"
          />

          <SectionLabel label="TIMING" colors={colors} />
          <TimingToggle selected={type} onSelect={setType} />

          {type === 'planned' && (
            <View style={sheetStyles.timeRow}>
              <TouchableOpacity
                onPress={() => setActivePicker('date')}
                style={[sheetStyles.timeChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              >
                <Text style={[sheetStyles.timeChipText, { color: colors.textPrimary }]}>
                  {formatDate(date)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActivePicker('time')}
                style={[sheetStyles.timeChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              >
                <Text style={[sheetStyles.timeChipText, { color: colors.textPrimary }]}>
                  {formatTime(date)}
                </Text>
              </TouchableOpacity>
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
            style={[
              sheetStyles.submitBtn,
              { backgroundColor: canSubmit ? colors.textPrimary : colors.border },
            ]}
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

      <PickerModal
        visible={activePicker !== null}
        type={activePicker ?? 'date'}
        date={date}
        onSelectDate={handleSelectDate}
        onSelectTime={handleSelectTime}
        onClose={() => setActivePicker(null)}
        colors={colors}
      />
    </>
  );
}

// ─── Sheet styles ─────────────────────────────────────────────────────────────

const sheetStyles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing['5'],
    paddingBottom: Spacing['4'],
    gap: Spacing['3'],
  },
  heading: {
    fontFamily: FontFamily.serifDisplay,
    fontSize: FontSize['2xl'],
    marginBottom: Spacing['2'],
    marginTop: Spacing['2'],
  },
  sectionLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginTop: Spacing['2'],
  },
  input: {
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing['3'],
  },
  timeChip: {
    flex: 1,
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  timeChipText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  errorText: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    color: '#dc2626',
  },
  footer: {
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['4'],
    borderTopWidth: 1,
  },
  submitBtn: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing['4'],
    alignItems: 'center',
  },
  submitText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.md,
  },
});
