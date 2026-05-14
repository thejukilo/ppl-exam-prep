import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Button } from '../components/Button';
import { markOnboardingComplete } from '../redux/store';
import { colors } from '../utils/colors';
import { spacing } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width: SCREEN_W } = Dimensions.get('window');

interface Slide {
  emoji: string;
  title: string;
  body: string;
  color: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🛫',
    title: 'Pass the EASA PPL exam',
    body: '893 official-style practice questions covering all 9 subjects — Air Law, Meteorology, Navigation, Principles of Flight, and more.',
    color: '#FFE2C4',
  },
  {
    emoji: '🎯',
    title: 'Train smarter',
    body: 'Detailed explanations, charts and diagrams, mock exams with timer, and a dedicated mode to drill the questions you got wrong.',
    color: '#FFD9A8',
  },
  {
    emoji: '📈',
    title: 'Track your progress',
    body: 'See accuracy per subject, bookmark the trickiest questions, and sync your progress across all your devices.',
    color: '#FFCB8E',
  },
];

export function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<Slide>>(null);

  const finish = async () => {
    // Updating Redux causes the RootNavigator to switch from the Onboarding
    // branch to the Tabs branch automatically — no explicit navigation needed.
    await markOnboardingComplete();
  };

  const next = () => {
    if (index === SLIDES.length - 1) {
      finish();
    } else {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const isLast = index === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        <Pressable
          onPress={finish}
          hitSlop={12}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.skipText}>{isLast ? '' : 'Skip'}</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <SlideCard slide={item} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button
          title={isLast ? 'Get started' : 'Next'}
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}

function SlideCard({ slide }: { slide: Slide }) {
  return (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <View style={[styles.illustration, { backgroundColor: slide.color }]}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
      </View>
      <Text style={[typography.display, styles.title]}>{slide.title}</Text>
      <Text style={[typography.body, styles.body]}>{slide.body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    height: 32,
  },
  skipText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  illustration: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emoji: { fontSize: 96 },
  title: {
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
