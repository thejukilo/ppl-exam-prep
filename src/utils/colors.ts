/**
 * Color tokens.
 *
 * Inspired by Headspace's warm/playful palette but rooted in aviation:
 * sky and cloud whites, sunset orange as the action color, deep blue
 * reserved for emphasis.
 */
export const colors = {
  // Brand
  primary: '#FF8A3D',          // sunset orange — main CTA
  primaryDark: '#E36F1F',
  accent: '#3B82F6',           // sky blue — secondary highlights
  accentDeep: '#1E3A8A',       // deep navy for emphasis

  // Sky scene (welcome screen)
  skyTop: '#FFD89C',           // warm dawn
  skyBottom: '#FFF1DE',        // cream
  cloudPink: '#FFCBC4',
  cloudCream: '#FFEFD9',

  // Status
  success: '#16A34A',
  successBg: '#DCFCE7',
  error: '#E11D48',
  errorBg: '#FFE4E6',
  warning: '#F59E0B',

  // Surfaces
  background: '#FFFAF2',       // soft cream
  surface: '#FFFFFF',
  surfaceAlt: '#FFF1DE',
  border: '#F1E4D0',
  borderStrong: '#E2D3BC',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#5C5C5C',
  textMuted: '#9C9C9C',
  textInverse: '#FFFFFF',

  // Premium
  premium: '#FF8A3D',
  premiumBg: '#FFE4CB',
} as const;
