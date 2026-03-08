import React from 'react';
import type { UnitType, ObjectCategory } from '@/domain/models';
import { UNIT_ICON_URLS } from '@/assets/icons';

interface UnitIconProps {
  unitType: UnitType;
  size?: number;
}

const UnitIcon: React.FC<UnitIconProps> = ({ unitType, size = 40 }) => {
  const iconUrl = UNIT_ICON_URLS[unitType];

  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={unitType}
          className="w-full h-full object-contain"
          draggable={false}
        />
      ) : (
        <span className="text-primary font-mono font-bold" style={{ fontSize: size * 0.45 }}>?</span>
      )}
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
  { type: 'artillery', label: 'Cherry Cannon', category: 'military' },
  { type: 'naval', label: 'Naval', category: 'military' },
  { type: 'air', label: 'Eagle', category: 'military' },
  { type: 'hq', label: 'HQ', category: 'military' },
  { type: 'supply', label: 'Supply', category: 'military' },
  // Structures
  { type: 'house', label: 'House', category: 'structure' },
  { type: 'castle', label: 'Fortress', category: 'structure' },
  { type: 'tower', label: 'Tower', category: 'structure' },
  { type: 'church', label: 'Church', category: 'structure' },
  { type: 'tavern', label: 'Han/Tavern', category: 'structure' },
  { type: 'windmill', label: 'Water Mill', category: 'structure' },
  { type: 'bridge', label: 'Bridge', category: 'structure' },
  { type: 'gate', label: 'Gate', category: 'structure' },
  { type: 'farm', label: 'Farm', category: 'structure' },
  // Props & Fortifications
  { type: 'barrel', label: 'Barrels', category: 'prop' },
  { type: 'haystack', label: 'Haystack', category: 'prop' },
  { type: 'cart', label: 'Cart', category: 'prop' },
  { type: 'chest', label: 'Chest', category: 'prop' },
  { type: 'well', label: 'Well', category: 'prop' },
  { type: 'campfire', label: 'Campfire', category: 'prop' },
  { type: 'tent', label: 'Tent', category: 'prop' },
  { type: 'flag', label: 'Свобода или смърт', category: 'prop' },
  { type: 'fence', label: 'Fence', category: 'prop' },
  { type: 'wooden_barricade', label: 'Wood Barricade', category: 'prop' },
  { type: 'stone_barricade', label: 'Stone Barricade', category: 'prop' },
  { type: 'pathway', label: 'Pathway', category: 'prop' },
  // Terrain
  { type: 'tree', label: 'Tree', category: 'terrain' },
  { type: 'rock', label: 'Rock', category: 'terrain' },
  { type: 'mountain', label: 'Mountain', category: 'terrain' },
  { type: 'river', label: 'River', category: 'terrain' },
];

export const UNIT_CATEGORIES: { key: ObjectCategory; label: string; icon: string }[] = [
  { key: 'military', label: 'Military Units', icon: '⚔' },
  { key: 'structure', label: 'Structures', icon: '🏰' },
  { key: 'prop', label: 'Props & Fortifications', icon: '🛡️' },
  { key: 'terrain', label: 'Terrain', icon: '🌲' },
];

export default UnitIcon;
