import { UNIT_ICON_KEYS } from '@/assets/icons';
import type { ObjectCategory } from './models';

export interface UnitMetadata {
  label?: string;
  shortLabel?: string;
  category?: ObjectCategory;
  symbol?: string;
}

export const UNIT_METADATA: Record<string, UnitMetadata> = {
  infantry: { label: 'Infantry', shortLabel: 'INF', category: 'military', symbol: '\u2694' },
};

export const formatUnitTypeLabel = (unitType: string): string => {
  if (!unitType) return 'Unknown';

  return unitType
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

export const getUnitDisplayLabel = (unitType: string): string => {
  return UNIT_METADATA[unitType]?.label ?? formatUnitTypeLabel(unitType);
};

export const getUnitShortLabel = (unitType?: string): string => {
  if (!unitType) return '?';
  const metaShort = UNIT_METADATA[unitType]?.shortLabel;
  if (metaShort) return metaShort;

  const normalized = unitType.replace(/[_-]+/g, ' ').trim();
  if (!normalized) return '?';
  return normalized.slice(0, 3).toUpperCase();
};

export const getUnitCategory = (unitType?: string): ObjectCategory => {
  if (!unitType) return 'military';
  return UNIT_METADATA[unitType]?.category ?? 'military';
};

export const getUnitSymbol = (unitType?: string): string => {
  if (!unitType) return '\u2694';
  return UNIT_METADATA[unitType]?.symbol ?? '\u2694';
};

export const DISCOVERED_UNIT_TYPES = UNIT_ICON_KEYS;
