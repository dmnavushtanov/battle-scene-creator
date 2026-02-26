import React from 'react';
import type { UnitType, Side } from '@/types/editor';

const SIDE_COLORS: Record<Side, string> = {
  red: '#cc3333',
  blue: '#3366cc',
  neutral: '#888888',
};

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
  side: Side;
  size?: number;
}

const UnitIcon: React.FC<UnitIconProps> = ({ unitType, side, size = 40 }) => {
  const color = SIDE_COLORS[side];
  const symbol = UNIT_SYMBOLS[unitType];

  return (
    <div
      className="flex items-center justify-center border-2 rounded font-mono font-bold select-none"
      style={{
        width: size,
        height: size,
        borderColor: color,
        backgroundColor: `${color}33`,
        color: color,
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
