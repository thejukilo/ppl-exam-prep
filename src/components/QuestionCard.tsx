import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Question } from '../types';
import { colors } from '../utils/colors';
import { spacing, radius } from '../utils/spacing';
import { typography } from '../utils/fonts';
import { htmlToLines } from '../utils/htmlText';

interface Props {
  question: Question;
  selectedAnswer: number | null;
  revealed: boolean;
  onSelect: (index: number) => void;
}

export function QuestionCard({ question, selectedAnswer, revealed, onSelect }: Props) {
  const lines = htmlToLines(question.text);

  return (
    <View>
      <View style={styles.questionBlock}>
        {lines.map((line, i) => (
          <Text key={i} style={[typography.body, styles.line]}>
            {line}
          </Text>
        ))}
      </View>

      {question.attachmentUrl ? (
        <Image
          source={{ uri: question.attachmentUrl }}
          style={styles.attachment}
          resizeMode="contain"
        />
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        {question.options.map((opt, i) => (
          <OptionRow
            key={i}
            index={i}
            text={opt}
            selected={selectedAnswer === i}
            correct={revealed && i === question.correctAnswer}
            wrong={revealed && selectedAnswer === i && i !== question.correctAnswer}
            disabled={revealed}
            onPress={() => onSelect(i)}
          />
        ))}
      </View>

      {revealed && (
        <View style={styles.explanationBlock}>
          <Text style={[typography.micro, styles.explanationLabel]}>EXPLANATION</Text>
          <Text style={[typography.body, styles.explanationBody]}>
            {question.explanation
              ? question.explanation
              : 'No explanation has been added for this question yet. Check back later — we are working on it.'}
          </Text>
        </View>
      )}
    </View>
  );
}

interface OptionProps {
  index: number;
  text: string;
  selected: boolean;
  correct: boolean;
  wrong: boolean;
  disabled: boolean;
  onPress: () => void;
}

function OptionRow({ index, text, selected, correct, wrong, disabled, onPress }: OptionProps) {
  let bg = colors.surface;
  let border = colors.border;
  let fg = colors.textPrimary;

  if (correct) { bg = colors.successBg; border = colors.success; fg = colors.success; }
  else if (wrong) { bg = colors.errorBg; border = colors.error; fg = colors.error; }
  else if (selected) { border = colors.primary; bg = colors.surface; }

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: bg, borderColor: border },
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.bullet, { borderColor: border }]}>
        <Text style={[styles.bulletText, { color: fg }]}>
          {String.fromCharCode(65 + index)}
        </Text>
      </View>
      <Text style={[typography.body, { color: fg, flex: 1 }]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  questionBlock: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  line: { color: colors.textPrimary, marginBottom: spacing.xs },
  attachment: {
    width: '100%',
    height: 220,
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  bullet: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bulletText: { fontSize: 13, fontWeight: '700' },
  explanationBlock: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  explanationLabel: { color: colors.primary, marginBottom: spacing.xs },
  explanationBody: { color: colors.textPrimary },
});
