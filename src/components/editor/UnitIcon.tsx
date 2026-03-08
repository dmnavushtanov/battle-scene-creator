import React from 'react';
import type { UnitType, ObjectCategory } from '@/domain/models';
import { UNIT_SYMBOLS } from '@/domain/constants';

interface UnitIconProps {
  unitType: UnitType;
  size?: number;
}

const UnitIcon: React.FC<UnitIconProps> = ({ unitType, size = 40 }) => {
  const symbol = UNIT_SYMBOLS[unitType] || '?';

  return (
    <div
      className="flex items-center justify-center border-2 rounded font-mono font-bold select-none border-primary bg-primary/20 text-primary"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
      }}
    >
      {symbol}
    </div>
  );
};

export interface UnitTypeEntry {
  type: UnitType;
  label: string;
  category: ObjectCategory;
}

export const UNIT_TYPES: UnitTypeEntry[] = [
  // Military
  { type: 'infantry', label: 'Infantry', category: 'military' },
  { type: 'cavalry', label: 'Cavalry', category: 'military' },
  { type: 'armor', label: 'Armor', category: 'military' },
  { type: 'artillery', label: 'Artillery', category: 'military' },
  { type: 'naval', label: 'Naval', category: 'military' },
  { type: 'air', label: 'Air', category: 'military' },
  { type: 'hq', label: 'HQ', category: 'military' },
  { type: 'supply', label: 'Supply', category: 'military' },
  // Structures
  { type: 'house', label: 'House', category: 'structure' },
  { type: 'castle', label: 'Castle', category: 'structure' },
  { type: 'tower', label: 'Tower', category: 'structure' },
  { type: 'church', label: 'Church', category: 'structure' },
  { type: 'tavern', label: 'Tavern', category: 'structure' },
  { type: 'windmill', label: 'Windmill', category: 'structure' },
  { type: 'bridge', label: 'Bridge', category: 'structure' },
  { type: 'gate', label: 'Gate', category: 'structure' },
  // Props
  { type: 'barrel', label: 'Barrel', category: 'prop' },
  { type: 'haystack', label: 'Haystack', category: 'prop' },
  { type: 'cart', label: 'Cart', category: 'prop' },
  { type: 'chest', label: 'Chest', category: 'prop' },
  { type: 'well', label: 'Well', category: 'prop' },
  { type: 'campfire', label: 'Campfire', category: 'prop' },
  { type: 'tent', label: 'Tent', category: 'prop' },
  { type: 'flag', label: 'Flag', category: 'prop' },
  // Terrain
  { type: 'tree', label: 'Tree', category: 'terrain' },
  { type: 'rock', label: 'Rock', category: 'terrain' },
  { type: 'mountain', label: 'Mountain', category: 'terrain' },
  { type: 'river', label: 'River', category: 'terrain' },
];

export const UNIT_CATEGORIES: { key: ObjectCategory; label: string; icon: string }[] = [
  { key: 'military', label: 'Military Units', icon: '⚔' },
  { key: 'structure', label: 'Structures', icon: '🏰' },
  { key: 'prop', label: 'Props', icon: '🛢️' },
  { key: 'terrain', label: 'Terrain', icon: '🌲' },
];

export default UnitIcon;
