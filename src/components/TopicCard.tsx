import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Topic, TopicProgress } from '../types';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';

interface Props {
  topic: Topic;
  progress?: TopicProgress;
  locked?: boolean;
  onPress: () => void;
}

export function TopicCard({ topic, progress, locked = false, onPress }: Props) {
  const attempted = progress?.attempted ?? 0;
  const correct = progress?.correct ?? 0;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.accent, { backgroundColor: topic.color }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[typography.h3, styles.title]} numberOfLines={2}>
            {topic.name}
          </Text>
          {locked && (
            <View style={styles.lockBadge}>
              <Text style={styles.lockText}>PRO</Text>
            </View>
          )}
        </View>

        <Text style={[typography.caption, styles.desc]} numberOfLines={2}>
          {topic.description}
        </Text>

        <View style={styles.footer}>
          <Text style={[typography.micro, styles.qcount]}>
            {topic.questionCount} QUESTIONS
          </Text>
          {accuracy !== null && (
            <Text style={[typography.micro, { color: topic.color }]}>
              {accuracy}% • {attempted}/{topic.questionCount}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  accent: { width: 5 },
  body: { flex: 1, padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
  desc: { color: colors.textSecondary, marginTop: spacing.xs },
  footer: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qcount: { color: colors.textMuted },
  lockBadge: {
    backgroundColor: colors.premiumBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  lockText: {
    color: colors.premium,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
