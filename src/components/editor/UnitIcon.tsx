import React from 'react';
import type { UnitType } from '@/domain/models';

const UNIT_SYMBOLS: Record<UnitType, string> = {
  infantry: '⚔',
  cavalry: '🐎',
  armor: '⬣',
  artillery: '💣',
  naval: '⚓',
  air: '✈',
  hq: '★',
  supply: '📦',
};

interface UnitIconProps {
  unitType: UnitType;
  size?: number;
}

const UnitIcon: React.FC<UnitIconProps> = ({ unitType, size = 40 }) => {
  const symbol = UNIT_SYMBOLS[unitType];

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

export const UNIT_TYPES: { type: UnitType; label: string }[] = [
  { type: 'infantry', label: 'Infantry' },
  { type: 'cavalry', label: 'Cavalry' },
  { type: 'armor', label: 'Armor' },
  { type: 'artillery', label: 'Artillery' },
  { type: 'naval', label: 'Naval' },
  { type: 'air', label: 'Air' },
  { type: 'hq', label: 'HQ' },
  { type: 'supply', label: 'Supply' },
];

export default UnitIcon;
