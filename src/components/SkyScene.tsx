import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { colors } from '../utils/colors';

/**
 * Animated welcome scene.
 *
 * Built with the React Native Animated API + react-native-svg. No Lottie
 * needed for v1 — but you can swap in a Lottie file later by replacing
 * the <Plane /> SVG with <LottieView />.
 *
 * Layers (back to front):
 *   1. Linear gradient sky (warm dawn)
 *   2. Sun
 *   3. Two cloud rows that drift slowly right-to-left at different speeds
 *   4. A plane that flies left-to-right with a gentle bob, leaving a trail
 */

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  height?: number;
}

export function SkyScene({ height = 360 }: Props) {
  // Cloud drifting (continuous loop)
  const cloudsBack = useRef(new Animated.Value(0)).current;
  const cloudsFront = useRef(new Animated.Value(0)).current;

  // Plane: horizontal pos + vertical bob
  const planeX = useRef(new Animated.Value(-80)).current;
  const planeBob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, ms: number) =>
      Animated.loop(
        Animated.timing(val, {
          toValue: 1,
          duration: ms,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

    loop(cloudsBack, 32000).start();
    loop(cloudsFront, 22000).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(planeX, {
          toValue: SCREEN_W + 80,
          duration: 14000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(planeX, {
          toValue: -80,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(planeBob, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(planeBob, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [cloudsBack, cloudsFront, planeX, planeBob]);

  const cloudsBackTranslate = cloudsBack.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_W],
  });
  const cloudsFrontTranslate = cloudsFront.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_W],
  });
  const planeY = planeBob.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={[styles.container, { height }]}>
      <LinearGradient
        colors={[colors.skyTop, colors.skyBottom]}
        style={StyleSheet.absoluteFill}
      />

      {/* Sun */}
      <Svg
        width={120}
        height={120}
        style={{ position: 'absolute', top: height * 0.18, right: 32 }}
      >
        <Circle cx={60} cy={60} r={50} fill="#FFE4A8" opacity={0.6} />
        <Circle cx={60} cy={60} r={36} fill="#FFD27A" />
      </Svg>

      {/* Back cloud row (slower, smaller, more transparent) */}
      <Animated.View
        style={[
          styles.cloudRow,
          {
            top: height * 0.35,
            transform: [{ translateX: cloudsBackTranslate }],
            opacity: 0.6,
          },
        ]}
      >
        <CloudShape size={70} color={colors.cloudCream} offsetX={SCREEN_W * 0.1} />
        <CloudShape size={50} color={colors.cloudCream} offsetX={SCREEN_W * 0.55} />
        <CloudShape size={60} color={colors.cloudCream} offsetX={SCREEN_W * 0.85} />
        {/* Duplicate set for seamless loop */}
        <CloudShape size={70} color={colors.cloudCream} offsetX={SCREEN_W * 1.1} />
        <CloudShape size={50} color={colors.cloudCream} offsetX={SCREEN_W * 1.55} />
        <CloudShape size={60} color={colors.cloudCream} offsetX={SCREEN_W * 1.85} />
      </Animated.View>

      {/* Front cloud row */}
      <Animated.View
        style={[
          styles.cloudRow,
          {
            top: height * 0.6,
            transform: [{ translateX: cloudsFrontTranslate }],
          },
        ]}
      >
        <CloudShape size={90} color={colors.cloudPink} offsetX={SCREEN_W * 0.05} />
        <CloudShape size={70} color={colors.cloudPink} offsetX={SCREEN_W * 0.45} />
        <CloudShape size={80} color={colors.cloudPink} offsetX={SCREEN_W * 0.78} />
        <CloudShape size={90} color={colors.cloudPink} offsetX={SCREEN_W * 1.05} />
        <CloudShape size={70} color={colors.cloudPink} offsetX={SCREEN_W * 1.45} />
        <CloudShape size={80} color={colors.cloudPink} offsetX={SCREEN_W * 1.78} />
      </Animated.View>

      {/* Plane */}
      <Animated.View
        style={[
          styles.plane,
          {
            top: height * 0.32,
            transform: [{ translateX: planeX }, { translateY: planeY }],
          },
        ]}
      >
        <PlaneShape />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SVG primitives
// ---------------------------------------------------------------------------

function CloudShape({
  size,
  color,
  offsetX,
}: {
  size: number;
  color: string;
  offsetX: number;
}) {
  return (
    <View style={{ position: 'absolute', left: offsetX }}>
      <Svg width={size * 1.6} height={size}>
        <G>
          <Ellipse cx={size * 0.45} cy={size * 0.65} rx={size * 0.45} ry={size * 0.32} fill={color} />
          <Ellipse cx={size * 0.85} cy={size * 0.55} rx={size * 0.4} ry={size * 0.4} fill={color} />
          <Ellipse cx={size * 1.2} cy={size * 0.65} rx={size * 0.35} ry={size * 0.3} fill={color} />
        </G>
      </Svg>
    </View>
  );
}

function PlaneShape() {
  // Friendly cartoon plane silhouette in white with orange accents
  return (
    <Svg width={80} height={48} viewBox="0 0 80 48">
      {/* Wing shadow */}
      <Path
        d="M22 28 L8 38 L18 30 L26 28 Z"
        fill={colors.primaryDark}
        opacity={0.5}
      />
      {/* Body */}
      <Path
        d="M2 24 Q2 20 8 19 L48 18 Q58 18 64 22 L74 24 Q76 24 76 25 Q76 26 74 26 L64 28 Q58 32 48 32 L8 31 Q2 30 2 26 Z"
        fill={colors.surface}
        stroke={colors.textPrimary}
        strokeWidth={1.5}
      />
      {/* Top wing */}
      <Path
        d="M28 19 L20 8 L34 18 Z"
        fill={colors.primary}
        stroke={colors.textPrimary}
        strokeWidth={1.5}
      />
      {/* Bottom wing */}
      <Path
        d="M28 31 L20 42 L34 32 Z"
        fill={colors.primary}
        stroke={colors.textPrimary}
        strokeWidth={1.5}
      />
      {/* Tail fin */}
      <Path
        d="M58 18 L52 10 L62 18 Z"
        fill={colors.primaryDark}
        stroke={colors.textPrimary}
        strokeWidth={1.5}
      />
      {/* Window */}
      <Rect x={42} y={21} width={10} height={6} rx={2} fill={colors.accent} stroke={colors.textPrimary} strokeWidth={1} />
      {/* Nose detail */}
      <Circle cx={72} cy={25} r={2} fill={colors.accent} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  cloudRow: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    width: SCREEN_W * 2,
    height: 100,
  },
  plane: {
    position: 'absolute',
    left: 0,
  },
});
