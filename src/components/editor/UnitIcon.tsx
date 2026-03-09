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
  { type: 'infantry', label: 'Infantry', category: 'military' },
];

export const UNIT_CATEGORIES: { key: ObjectCategory; label: string; icon: string }[] = [
  { key: 'military', label: 'Military Units', icon: '\u2694' },
];

export default UnitIcon;
