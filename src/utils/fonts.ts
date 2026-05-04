import { TextStyle } from 'react-native';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

/**
 * Typography. Uses Nunito (loaded via expo-font in App.tsx) for that warm,
 * rounded Headspace-y feel. Falls back to system font if Nunito isn't loaded.
 */

const family = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extra: 'Nunito_800ExtraBold',
};

export const typography = {
  display:    { fontSize: 32, fontFamily: family.extra,    lineHeight: 38 } as TextStyle,
  h1:         { fontSize: 26, fontFamily: family.bold,     lineHeight: 32 } as TextStyle,
  h2:         { fontSize: 20, fontFamily: family.bold,     lineHeight: 26 } as TextStyle,
  h3:         { fontSize: 17, fontFamily: family.semibold, lineHeight: 22 } as TextStyle,
  body:       { fontSize: 15, fontFamily: family.regular,  lineHeight: 22 } as TextStyle,
  bodyStrong: { fontSize: 15, fontFamily: family.semibold, lineHeight: 22 } as TextStyle,
  caption:    { fontSize: 13, fontFamily: family.regular,  lineHeight: 18 } as TextStyle,
  micro:      { fontSize: 11, fontFamily: family.bold,     lineHeight: 14, letterSpacing: 0.6 } as TextStyle,
} as const;

// Used by App.tsx to load fonts before showing UI
export const fontMap = {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
};
