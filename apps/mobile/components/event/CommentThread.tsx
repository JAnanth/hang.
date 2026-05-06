import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from '../../constants/colors.js';
import { FontFamily, FontSize, Spacing, Radius } from '../../constants/typography.js';
import type { EventComment } from '@hang/shared';

interface CommentThreadProps {
  comments: EventComment[];
  onAddComment: (body: string) => void;
  isSubmitting?: boolean;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function CommentThread({ comments, onAddComment, isSubmitting }: CommentThreadProps) {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? DarkColors : LightColors;
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');

  const shown = expanded ? comments : comments.slice(0, 3);

  const handleSubmit = () => {
    if (draft.trim().length === 0) return;
    onAddComment(draft.trim());
    setDraft('');
  };

  return (
    <View style={styles.container}>
      {shown.map((comment) => (
        <View
          key={comment.id}
          style={[styles.commentBubble, { backgroundColor: colors.surfaceAlt }]}
        >
          <Text style={[styles.commentBody, { color: colors.textPrimary }]}>{comment.body}</Text>
          <Text style={[styles.commentMeta, { color: colors.textTertiary }]}>
            {comment.user.name} · {formatTimeAgo(comment.createdAt)}
          </Text>
        </View>
      ))}

      {comments.length > 3 && !expanded && (
        <TouchableOpacity onPress={() => setExpanded(true)}>
          <Text style={[styles.expandText, { color: colors.accent }]}>
            See {comments.length - 3} more comments
          </Text>
        </TouchableOpacity>
      )}

      <View style={[styles.inputRow, { borderColor: colors.border }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a comment…"
          placeholderTextColor={colors.textTertiary}
          style={[styles.input, { color: colors.textPrimary }]}
          returnKeyType="send"
          onSubmitEditing={handleSubmit}
          maxLength={280}
        />
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={draft.trim().length === 0 || isSubmitting}
        >
          <Text style={[styles.sendBtn, { color: draft.trim().length > 0 ? colors.accent : colors.textTertiary }]}>
            Send
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing['2'],
  },
  commentBubble: {
    borderRadius: Radius.md,
    padding: Spacing['3'],
  },
  commentBody: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    lineHeight: FontSize.base * 1.5,
    marginBottom: 4,
  },
  commentMeta: {
    fontFamily: FontFamily.sans,
    fontSize: FontSize.xs,
  },
  expandText: {
    fontFamily: FontFamily.sansMedium,
    fontSize: FontSize.sm,
    paddingVertical: Spacing['1'],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing['3'],
    gap: Spacing['3'],
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: FontSize.base,
    paddingVertical: Spacing['2'],
  },
  sendBtn: {
    fontFamily: FontFamily.sansSemiBold,
    fontSize: FontSize.base,
  },
});
