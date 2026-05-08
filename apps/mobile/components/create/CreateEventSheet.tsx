import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { useColorScheme } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { BottomSheet } from '../ui/BottomSheet';
import { TimingToggle } from './TimingToggle';
import { GroupMultiSelect } from './GroupMultiSelect';
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography';
import { useGroups } from '../../hooks/useGroups';
import { useCreateEvent } from '../../hooks/useEvent';
import { useUiStore } from '../../stores/uiStore';
import type { EventType } from '@hang/shared';

function SectionLabel({ label, colors }: { label: string; colors: typeof LightColors }) {
  return (
    <Text style={[sheetStyles.sectionLabel, { color: colors.textTertiary }]}>{label}</Text>
  );
}

type PickerMode = 'date' | 'time' | null;

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
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2, 0, 0, 0);
    return d;
  });
  const [timeOptions, setTimeOptions] = useState<string[]>([
    new Date(Date.now() + 3600 * 1000).toISOString(),
    new Date(Date.now() + 7200 * 1000).toISOString(),
  ]);

  // Date/time picker state
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);

  const primaryGroup = groups.find((g) => selectedGroupIds[0] === g.id);
  const canSubmit = title.trim().length > 0 && selectedGroupIds.length > 0 && !isPending;

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setPickerMode(null);
    }
    if (selected) {
      if (pickerMode === 'date') {
        const next = new Date(selected);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        setDate(next);
        // On Android, prompt for time next
        if (Platform.OS === 'android') {
          setTimeout(() => setPickerMode('time'), 100);
        }
      } else {
        const next = new Date(date);
        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        setDate(next);
        if (Platform.OS === 'android') {
          setPickerMode(null);
        }
      }
    }
  };

  const closePicker = () => setPickerMode(null);

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

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const iosPicker = pickerMode !== null && Platform.OS === 'ios' ? (
    <Modal transparent animationType="slide" visible>
      <TouchableOpacity style={sheetStyles.pickerOverlay} onPress={closePicker} activeOpacity={1}>
        <View style={[sheetStyles.pickerCard, { backgroundColor: colors.surface }]}>
          <View style={[sheetStyles.pickerHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={closePicker}>
              <Text style={[sheetStyles.pickerDone, { color: colors.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={date}
            mode={pickerMode}
            display="spinner"
            onChange={handleDateChange}
            minimumDate={new Date()}
            textColor={colors.textPrimary}
            style={{ height: 200 }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  ) : null;

  const androidPicker = pickerMode !== null && Platform.OS === 'android' ? (
    <DateTimePicker
      value={date}
      mode={pickerMode}
      display="default"
      onChange={handleDateChange}
      minimumDate={new Date()}
    />
  ) : null;

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
            <View style={[sheetStyles.errorBox, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
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
                onPress={() => setPickerMode('date')}
                style={[sheetStyles.timeChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              >
                <Text style={[sheetStyles.timeChipText, { color: colors.textPrimary }]}>
                  {formatDate(date)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPickerMode('time')}
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
              {
                backgroundColor: canSubmit ? colors.textPrimary : colors.border,
              },
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

      {iosPicker}
      {androidPicker}
    </>
  );
}

const sheetStyles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
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
  pickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing['5'],
    paddingVertical: Spacing['3'],
    borderBottomWidth: 1,
  },
  pickerDone: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
});
