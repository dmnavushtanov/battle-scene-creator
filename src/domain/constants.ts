import type { EffectType, UnitType, ObjectCategory } from './models';

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
  // Structures
  house: '🏠',
  castle: '🏰',
  tower: '🗼',
  church: '⛪',
  tavern: '🍺',
  windmill: '🌬️',
  bridge: '🌉',
  gate: '🚪',
  // Props
  barrel: '🛢️',
  haystack: '🌾',
  cart: '🛒',
  chest: '📦',
  well: '⛲',
  campfire: '🔥',
  tent: '⛺',
  flag: '🏴',
  // Terrain
  tree: '🌲',
  rock: '🪨',
  mountain: '⛰️',
  river: '🌊',
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
  house: 'HSE',
  castle: 'CST',
  tower: 'TWR',
  church: 'CHR',
  tavern: 'TAV',
  windmill: 'WML',
  bridge: 'BRG',
  gate: 'GTE',
  barrel: 'BRL',
  haystack: 'HAY',
  cart: 'CRT',
  chest: 'CHT',
  well: 'WEL',
  campfire: 'CFR',
  tent: 'TNT',
  flag: 'FLG',
  tree: 'TRE',
  rock: 'RCK',
  mountain: 'MTN',
  river: 'RVR',
};

/** Category mapping for each unit type */
export const UNIT_CATEGORY: Record<string, ObjectCategory> = {
  infantry: 'military',
  cavalry: 'military',
  armor: 'military',
  artillery: 'military',
  naval: 'military',
  air: 'military',
  hq: 'military',
  supply: 'military',
  house: 'structure',
  castle: 'structure',
  tower: 'structure',
  church: 'structure',
  tavern: 'structure',
  windmill: 'structure',
  bridge: 'structure',
  gate: 'structure',
  barrel: 'prop',
  haystack: 'prop',
  cart: 'prop',
  chest: 'prop',
  well: 'prop',
  campfire: 'prop',
  tent: 'prop',
  flag: 'prop',
  tree: 'terrain',
  rock: 'terrain',
  mountain: 'terrain',
  river: 'terrain',
};

/** Default unit color (amber) */
export const UNIT_COLOR = '#d4a843';

/** Rotating colors for group assignment */
export const GROUP_COLORS = [
  '#00bcd4', '#e91e63', '#4caf50', '#ff9800',
  '#9c27b0', '#2196f3', '#ff5722', '#009688',
];
