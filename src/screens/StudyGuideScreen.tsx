import React, { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { useAppSelector } from '../redux/store';
import { selectIsPremium } from '../redux/slices/subscriptionSlice';
import { getStudyGuideForTopic } from '../data/studyGuides';
import { getTopicById } from '../data/topics';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';
import { FREEMIUM } from '../config/freemium';

type Props = NativeStackScreenProps<RootStackParamList, 'StudyGuide'>;

export function StudyGuideScreen({ route, navigation }: Props) {
  const { topicId } = route.params;
  const guide = getStudyGuideForTopic(topicId);
  const topic = getTopicById(topicId);
  const isPremium = useAppSelector(selectIsPremium);

  useLayoutEffect(() => {
    if (guide) navigation.setOptions({ title: guide.title });
  }, [navigation, guide]);

  if (!guide || !topic) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Study guide not available.</Text>
      </View>
    );
  }

  // Free users get the first section only (if `isFreePreview` is true).
  const sectionsToShow = isPremium
    ? guide.sections
    : FREEMIUM.freeStudyGuidePreview && guide.isFreePreview
      ? guide.sections.slice(0, 1)
      : [];

  const lockedCount = guide.sections.length - sectionsToShow.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.hero, { borderLeftColor: topic.color }]}>
        <Text style={[typography.micro, { color: topic.color }]}>{topic.name.toUpperCase()}</Text>
        <Text style={[typography.h1, styles.title]}>{guide.title}</Text>
        <Text style={[typography.body, styles.intro]}>{guide.intro}</Text>
      </View>

      {sectionsToShow.length === 0 ? (
        <View style={styles.lockedFull}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>
            Study guides are a Premium feature
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            Upgrade to unlock all sections, plus unlimited practice questions and bookmarks.
          </Text>
          <Button
            title="Go Premium"
            onPress={() => navigation.navigate('Paywall')}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      ) : (
        sectionsToShow.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={[typography.h2, styles.sectionHeading]}>{s.heading}</Text>
            <Text style={[typography.body, styles.sectionBody]}>{s.body}</Text>
          </View>
        ))
      )}

      {lockedCount > 0 && sectionsToShow.length > 0 && (
        <View style={styles.lockedTeaser}>
          <Text style={[typography.h3, { color: colors.textPrimary }]}>
            {lockedCount} more section{lockedCount === 1 ? '' : 's'} in Premium
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
            Unlock the full study guide and unlimited practice.
          </Text>
          <Button
            title="Go Premium"
            onPress={() => navigation.navigate('Paywall')}
            style={{ marginTop: spacing.md }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    marginBottom: spacing.lg,
  },
  title: { color: colors.textPrimary, marginTop: spacing.xs },
  intro: { color: colors.textSecondary, marginTop: spacing.sm },
  section: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeading: { color: colors.textPrimary, marginBottom: spacing.sm },
  sectionBody: { color: colors.textPrimary },
  lockedFull: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.premiumBg,
    borderRadius: radius.lg,
  },
  lockedTeaser: {
    backgroundColor: colors.premiumBg,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
});
