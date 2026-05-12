import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
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

function buildTimeSlots(): Date[] {
  const slots: Date[] = [];
  const now = new Date();
  for (let day = 0; day < 14; day++) {
    for (let halfHour = 0; halfHour < 48; halfHour++) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + day);
      d.setMinutes(halfHour * 30);
      if (d > now) slots.push(d);
    }
  }
  return slots;
}

function formatSlot(d: Date): string {
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const isTomorrow =
    d.toDateString() === new Date(now.getTime() + 86400000).toDateString();
  const dayLabel = isToday
    ? 'Today'
    : isTomorrow
    ? 'Tomorrow'
    : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${dayLabel} · ${time}`;
}

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
  const slots = buildTimeSlots();

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
                  {date.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
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
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Suggest a time
              </Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={slots}
              keyExtractor={(item) => item.toISOString()}
              initialNumToRender={20}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSuggestTime(item.toISOString());
                    setPickerVisible(false);
                  }}
                  style={[styles.slotRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.slotText, { color: colors.textPrimary }]}>
                    {formatSlot(item)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
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
  confirmText: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.sm,
    color: '#ffffff',
  },
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
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['5'],
    paddingVertical: Spacing['4'],
    borderBottomWidth: 1,
  },
  modalTitle: { fontFamily: FontFamily.sansSemiBold, fontSize: FontSize.base },
  cancelText: { fontFamily: FontFamily.sans, fontSize: FontSize.base },
  slotRow: {
    paddingHorizontal: Spacing['5'],
    paddingVertical: Spacing['4'],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  slotText: { fontFamily: FontFamily.sans, fontSize: FontSize.base },
});
