export const COLORS = {
  NAVY: '#183A73',
  NAVY_DARK: '#09172E',
  ORANGE: '#F15A25',
  BG: '#FAFAFA',
  SURFACE: '#FFFFFF',
  TEXT: '#111827',
  MUTED: '#6B7280',
  BORDER: '#E5E7EB',
  SUCCESS: '#22C55E',
  ERROR: '#EF4444',
  WARNING: '#F59E0B',
  INFO: '#3B82F6',
} as const;

export const TAILWIND_COLORS = {
  navy: COLORS.NAVY,
  navyDark: COLORS.NAVY_DARK,
  orange: COLORS.ORANGE,
  bg: COLORS.BG,
  surface: COLORS.SURFACE,
  text: COLORS.TEXT,
  muted: COLORS.MUTED,
  border: COLORS.BORDER,
  success: COLORS.SUCCESS,
  error: COLORS.ERROR,
} as const;
