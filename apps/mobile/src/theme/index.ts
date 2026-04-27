/**
 * GymBros Design Tokens
 * Central source of truth for colors, typography, spacing, radius, and shadows.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg: '#030712',
  surface: '#111827',
  surface2: '#1f2937',
  border: '#374151',
  borderLight: '#4b5563',

  // Brand
  primary: '#22c55e',
  primaryDark: '#15803d',
  primaryLight: '#bbf7d0',
  secondary: '#3b82f6',
  secondaryDark: '#1d4ed8',
  secondaryLight: '#bfdbfe',

  // Text
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  textDisabled: '#6b7280',
  textInverse: '#030712',

  // Semantic
  success: '#22c55e',
  successBg: '#052e16',
  successText: '#bbf7d0',
  warning: '#f59e0b',
  warningBg: '#451a03',
  warningText: '#fde68a',
  error: '#ef4444',
  errorBg: '#450a0a',
  errorText: '#fca5a5',
  info: '#38bdf8',
  infoBg: '#0c4a6e',
  infoText: '#bae6fd',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
} as const;

// ─── Radius ───────────────────────────────────────────────────────────────────

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// ─── Tap target minimum ───────────────────────────────────────────────────────

export const minTapTarget = 44;
