export const COLORS = {
  NAVY: '#183A73',
  ORANGE: '#F15A25',
  BG: '#FAFAFA',
  TEXT: '#1E1E1E',
  BORDER: '#E5E7EB',
  SUCCESS: '#22C55E',
  ERROR: '#EF4444',
  WARNING: '#F59E0B',
  INFO: '#3B82F6',
} as const;

export const TAILWIND_COLORS = {
  navy: COLORS.NAVY,
  orange: COLORS.ORANGE,
  bg: COLORS.BG,
  text: COLORS.TEXT,
  border: COLORS.BORDER,
  success: COLORS.SUCCESS,
  error: COLORS.ERROR,
} as const;
