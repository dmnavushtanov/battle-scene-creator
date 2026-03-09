import type { ObjectCategory } from './models';

/** Colors for effect types on timeline and canvas badges */
export const EFFECT_COLORS: Record<string, string> = {
  explosion: '#ff6600',
  shake: '#ffaa00',
  crack: '#888888',
  blood: '#cc0000',
  smoke: '#9e9e9e',
  fire: '#ff4400',
  gunshot: '#ffdd00',
};

/** Emoji symbols for effect types */
export const EFFECT_VISUAL_SYMBOLS: Record<string, string> = {
  explosion: '\u{1F4A5}',
  shake: '\u{3030}\uFE0F',
  crack: '\u26A1',
  blood: '\u{1FA78}',
  smoke: '\u{1F4A8}',
  fire: '\u{1F525}',
  gunshot: '\u{1F52B}',
};

/** NATO-style unit symbols for canvas rendering */
export const UNIT_SYMBOLS: Record<string, string> = {
  infantry: '\u2694',
};

/** Short labels for unit types on canvas */
export const UNIT_LABELS: Record<string, string> = {
  infantry: 'INF',
};

/** Category mapping for each unit type */
export const UNIT_CATEGORY: Record<string, ObjectCategory> = {
  infantry: 'military',
};

/** Default unit color (amber) */
export const UNIT_COLOR = '#d4a843';

/** Rotating colors for group assignment */
export const GROUP_COLORS = [
  '#00bcd4', '#e91e63', '#4caf50', '#ff9800',
  '#9c27b0', '#2196f3', '#ff5722', '#009688',
];

/** Preset faction colors for quick assignment */
export const FACTION_COLORS = [
  { label: 'Blue', color: '#2196f3' },
  { label: 'Red', color: '#e53935' },
  { label: 'Green', color: '#43a047' },
  { label: 'Orange', color: '#ff9800' },
  { label: 'Purple', color: '#9c27b0' },
  { label: 'Teal', color: '#009688' },
  { label: 'Gold', color: '#d4a843' },
  { label: 'White', color: '#e0e0e0' },
];
