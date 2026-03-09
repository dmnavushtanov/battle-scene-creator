import React from 'react';
import type { UnitType, ObjectCategory } from '@/domain/models';
import { UNIT_ICON_URLS, UNIT_ICON_KEYS } from '@/assets/icons';
import { getUnitCategory, getUnitDisplayLabel } from '@/domain/unitMetadata';

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

export const UNIT_TYPES: UnitTypeEntry[] = UNIT_ICON_KEYS.map((key) => ({
  type: key,
  label: getUnitDisplayLabel(key),
  category: getUnitCategory(key),
}));

export const UNIT_CATEGORIES: { key: ObjectCategory; label: string; icon: string }[] = [
  { key: 'military', label: 'Military Units', icon: '\u2694' },
  { key: 'structure', label: 'Structures', icon: '\u{1F3D7}' },
  { key: 'prop', label: 'Props', icon: '\u{1F4E6}' },
  { key: 'terrain', label: 'Terrain', icon: '\u{1F30D}' },
];

export default UnitIcon;
