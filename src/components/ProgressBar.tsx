import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../utils/colors';
import { radius } from '../utils/spacing';

interface Props {
  value: number; // 0..1
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color = colors.primary, height = 6 }: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: '100%' },
});
