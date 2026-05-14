import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, G } from 'react-native-svg';
import { Plane } from 'lucide-react-native';
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

  // Plane: horizontal pos (driven manually each flight) + gentle vertical bob.
  // Each "flight" randomises direction, size, altitude and speed so the sky
  // feels like it has many different planes passing through, not one looped one.
  const planeX = useRef(new Animated.Value(-200)).current;
  const planeBob = useRef(new Animated.Value(0)).current;
  const [planeFlight, setPlaneFlight] = useState({
    /** -1 = right-to-left, 1 = left-to-right */
    direction: 1 as 1 | -1,
    /** scale factor: 0.55 (far) to 1.2 (close) */
    scale: 1,
    /** vertical offset within the upper portion of the scene */
    topRatio: 0.32,
  });

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

    // Continuous gentle bobbing while in flight
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

    // Recursive plane scheduler: pick random params, fly across, wait a bit,
    // then schedule the next flight.
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flyOne = () => {
      if (cancelled) return;
      // Random direction (50/50)
      const direction: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      // Three "depth" tiers so it reads as planes at different distances
      const tier = Math.random();
      const scale = tier < 0.33 ? 0.55 : tier < 0.7 ? 0.85 : 1.2;
      // Altitude variation: top 25%–55% of the scene
      const topRatio = 0.25 + Math.random() * 0.3;
      // Closer planes (bigger) move a bit faster — parallax cue.
      // Tuned for ~6–9s per crossing — long enough to enjoy, short enough
      // that the screen is rarely empty.
      const baseDuration = 9000 - scale * 2500; // 0.55 → ~7.6k, 1.2 → ~6k
      const duration = baseDuration + Math.random() * 2000; // jitter ±1s

      setPlaneFlight({ direction, scale, topRatio });

      // Set the start position and animate across.
      const offscreenStart = direction === 1 ? -200 : SCREEN_W + 200;
      const offscreenEnd = direction === 1 ? SCREEN_W + 200 : -200;
      planeX.setValue(offscreenStart);

      Animated.timing(planeX, {
        toValue: offscreenEnd,
        duration,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (cancelled || !finished) return;
        // Pause between flights: usually 0.4–1.6s, with a 25% chance of an
        // immediate follow-up (no pause) so occasionally two planes appear
        // close together — feels like real flight traffic.
        const pause = Math.random() < 0.25 ? 0 : 400 + Math.random() * 1200;
        timer = setTimeout(flyOne, pause);
      });
    };

    // Start the first flight almost immediately so the screen feels alive
    // from the moment it appears.
    timer = setTimeout(flyOne, 150);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
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
            top: height * planeFlight.topRatio,
            transform: [
              { translateX: planeX },
              { translateY: planeY },
              { scale: planeFlight.scale },
              // Flip horizontally when flying right-to-left
              { scaleX: planeFlight.direction },
            ],
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
  // Lucide's Plane icon points up-and-right (~45°). Rotating it +45° clockwise
  // makes the nose point straight right, matching the horizontal travel direction.
  // The base size is generous (80px) — the scheduler scales it down for "far"
  // planes to give a sense of depth.
  return (
    <View style={{ transform: [{ rotate: '45deg' }] }}>
      <Plane
        size={80}
        color={colors.primary}
        fill={colors.primary}
        strokeWidth={1.5}
      />
    </View>
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
