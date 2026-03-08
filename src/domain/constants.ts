import type { EffectType, UnitType } from './models';

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
  explosion: '💥',
  shake: '〰️',
  crack: '⚡',
  blood: '🩸',
  smoke: '💨',
  fire: '🔥',
  gunshot: '🔫',
};

/** NATO-style unit symbols for canvas rendering */
export const UNIT_SYMBOLS: Record<string, string> = {
  infantry: '⚔',
  cavalry: '🐎',
  armor: '⬣',
  artillery: '💣',
  naval: '⚓',
  air: '✈',
  hq: '★',
  supply: '📦',
};

/** Short labels for unit types on canvas */
export const UNIT_LABELS: Record<string, string> = {
  infantry: 'INF',
  cavalry: 'CAV',
  armor: 'ARM',
  artillery: 'ART',
  naval: 'NAV',
  air: 'AIR',
  hq: 'HQ',
  supply: 'SUP',
};

/** Default unit color (amber) */
export const UNIT_COLOR = '#d4a843';

/** Rotating colors for group assignment */
export const GROUP_COLORS = [
  '#00bcd4', '#e91e63', '#4caf50', '#ff9800',
  '#9c27b0', '#2196f3', '#ff5722', '#009688',
];
