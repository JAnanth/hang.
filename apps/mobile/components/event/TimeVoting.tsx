import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors.js';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography.js';
import type { EventTimeOption } from '@hang/shared';

interface TimeVotingProps {
  options: EventTimeOption[];
  onVote: (optionId: string) => void;
  onConfirm?: (optionId: string) => void;
  isCreator: boolean;
  isLoading?: boolean;
}

export function TimeVoting({ options, onVote, onConfirm, isCreator, isLoading }: TimeVotingProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;

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
                {
                  backgroundColor: `${colors.accent}22`,
                  width: `${pct * 100}%`,
                },
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
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing['2'],
  },
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
  dayLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.base,
  },
  timeLabel: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  leading: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.4,
  },
  voteCount: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.sm,
  },
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
});
