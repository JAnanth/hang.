import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography';
import type { EventTimeOption } from '@hang/shared';

interface TimeVotingProps {
  options: EventTimeOption[];
  onVote: (optionId: string) => void;
  onConfirm?: (optionId: string) => void;
  onSuggestTime?: (isoTime: string) => void;
  isCreator: boolean;
  isLoading?: boolean;
}

// ── Date/Time Picker ──────────────────────────────────────────────

function buildDays(): Date[] {
  const days: Date[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAYS = buildDays();
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 15, 30, 45];

function dayLabel(d: Date): { top: string; bottom: string } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - now.getTime()) / 86400000);
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

interface PickerProps {
  onSelect: (iso: string) => void;
  onCancel: () => void;
  colors: ReturnType<typeof getDarkColors>;
}

function getDarkColors() {
  return DarkColors;
}

function TimePicker({ onSelect, onCancel, colors }: PickerProps) {
  const [selDay, setSelDay] = useState<Date>(DAYS[0]);
  const [selHour, setSelHour] = useState<number>(6); // 6 PM default
  const [selMinute, setSelMinute] = useState<number>(0);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('PM');

  const canConfirm = (() => {
    const iso = buildIso(selDay, selHour, selMinute, ampm);
    return new Date(iso) > new Date();
  })();

  return (
    <View style={[pickerStyles.sheet, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[pickerStyles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={[pickerStyles.headerAction, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[pickerStyles.headerTitle, { color: colors.textPrimary }]}>Suggest a time</Text>
        <TouchableOpacity
          onPress={() => canConfirm && onSelect(buildIso(selDay, selHour, selMinute, ampm))}
          disabled={!canConfirm}
        >
          <Text
            style={[
              pickerStyles.headerAction,
              { color: canConfirm ? colors.accent : colors.border },
              { fontFamily: FontFamily.sansSemiBold },
            ]}
          >
            Add
          </Text>
        </TouchableOpacity>
      </View>

      {/* Day row */}
      <Text style={[pickerStyles.sectionLabel, { color: colors.textSecondary }]}>DATE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={pickerStyles.dayRow}>
        {DAYS.map((d) => {
          const label = dayLabel(d);
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

      {/* Minute + AM/PM row */}
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
              style={[
                pickerStyles.ampmBtn,
                ampm === a && { backgroundColor: colors.accent },
              ]}
            >
              <Text
                style={[
                  pickerStyles.ampmText,
                  { color: ampm === a ? '#fff' : colors.textSecondary },
                ]}
              >
                {a}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────

export function TimeVoting({
  options,
  onVote,
  onConfirm,
  onSuggestTime,
  isCreator,
  isLoading,
}: TimeVotingProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const [pickerVisible, setPickerVisible] = useState(false);

  const maxVotes = Math.max(...options.map((o) => o.voteCount), 1);

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textSecondary }]}>VOTE FOR A TIME</Text>

      {options.map((option) => {
        const date = new Date(option.proposedTime);
        const pct = option.voteCount / maxVotes;
        const isLeading = option.voteCount === maxVotes && option.voteCount > 0;

        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => onVote(option.id)}
            disabled={isLoading}
            style={[
              styles.optionRow,
              {
                backgroundColor: option.hasVoted ? `${colors.accent}18` : colors.surfaceAlt,
                borderColor: option.hasVoted ? colors.accent : colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                { backgroundColor: `${colors.accent}22`, width: `${pct * 100}%` },
              ]}
            />
            <View style={styles.optionContent}>
              <View>
                <Text style={[styles.dayLabel, { color: colors.textPrimary }]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </Text>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.right}>
                {isLeading && (
                  <Text style={[styles.leading, { color: colors.accent }]}>leading</Text>
                )}
                <Text style={[styles.voteCount, { color: colors.textSecondary }]}>
                  {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                </Text>
              </View>
            </View>

            {isCreator && onConfirm && (
              <TouchableOpacity
                onPress={() => onConfirm(option.id)}
                style={[styles.confirmBtn, { backgroundColor: colors.accent }]}
              >
                <Text style={styles.confirmText}>Confirm this time</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}

      {onSuggestTime && options.length < 8 && (
        <TouchableOpacity
          onPress={() => setPickerVisible(true)}
          style={[styles.suggestBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.suggestText, { color: colors.textSecondary }]}>
            + Suggest a time
          </Text>
        </TouchableOpacity>
      )}

      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <TimePicker
            colors={colors}
            onCancel={() => setPickerVisible(false)}
            onSelect={(iso) => {
              onSuggestTime?.(iso);
              setPickerVisible(false);
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: Spacing['2'] },
  heading: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing['1'],
  },
  optionRow: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: { position: 'absolute', top: 0, left: 0, bottom: 0 },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing['3'],
  },
  dayLabel: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  timeLabel: { fontFamily: FontFamily.sans, fontSize: FontSize.sm, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  leading: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.xs, letterSpacing: 0.4 },
  voteCount: { fontFamily: FontFamily.sans, fontSize: FontSize.sm },
  confirmBtn: {
    marginHorizontal: Spacing['3'],
    marginBottom: Spacing['3'],
    paddingVertical: Spacing['2'],
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  confirmText: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.sm, color: '#ffffff' },
  suggestBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: Spacing['3'],
    alignItems: 'center',
  },
  suggestText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.sm },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
});

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
  headerTitle: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.base },
  headerAction: { fontFamily: FontFamily.sans, fontSize: FontSize.base },
  sectionLabel: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginTop: Spacing['4'],
    marginBottom: Spacing['2'],
    paddingHorizontal: Spacing['5'],
  },
  dayRow: {
    paddingHorizontal: Spacing['5'],
    gap: Spacing['2'],
  },
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
  minuteGroup: {
    flexDirection: 'row',
    gap: Spacing['2'],
  },
  minuteChip: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['2'],
  },
  minuteText: { fontFamily: FontFamily.sansMedium, fontSize: FontSize.base },
  ampmToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  ampmBtn: {
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['2'],
  },
  ampmText: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.base },
});
