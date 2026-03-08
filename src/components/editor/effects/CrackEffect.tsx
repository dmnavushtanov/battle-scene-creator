import React from 'react';
import { Line } from 'react-konva';
import type { ActiveEffect } from '@/domain/models';

interface CrackEffectProps {
  size: number;
  effects: ActiveEffect[];
}

const CrackEffect: React.FC<CrackEffectProps> = ({ size, effects }) => {
  const crackEffect = effects.find((e) => e.type === 'crack');
  if (!crackEffect) return null;

  const s2 = size / 2;
  const op = crackEffect.ended ? 0.9 : Math.min(1, crackEffect.progress * 2);

  const cracks: { points: number[]; w: number; shade: string }[] = [
    { points: [0, -s2 * 0.1, -2, 0, 1, s2 * 0.2, -1, s2 * 0.55], w: 2.2, shade: '#888' },
    { points: [-2, 0, -s2 * 0.35, -s2 * 0.15, -s2 * 0.5, -s2 * 0.3], w: 1.5, shade: '#999' },
    { points: [-2, 0, s2 * 0.25, -s2 * 0.1, s2 * 0.45, -s2 * 0.25], w: 1.3, shade: '#aaa' },
    { points: [1, s2 * 0.2, s2 * 0.3, s2 * 0.35, s2 * 0.5, s2 * 0.28], w: 1.4, shade: '#999' },
    { points: [1, s2 * 0.2, -s2 * 0.2, s2 * 0.4, -s2 * 0.35, s2 * 0.55], w: 1.1, shade: '#aaa' },
    { points: [-s2 * 0.35, -s2 * 0.15, -s2 * 0.55, -s2 * 0.4], w: 0.7, shade: '#777' },
    { points: [s2 * 0.45, -s2 * 0.25, s2 * 0.55, -s2 * 0.45], w: 0.6, shade: '#777' },
    { points: [0, -s2 * 0.1, s2 * 0.1, -s2 * 0.35, s2 * 0.2, -s2 * 0.55], w: 1.0, shade: '#bbb' },
  ];

  return (
    <>
      {/* Shadow layer */}
      {cracks.slice(0, 5).map((c, i) => (
        <Line
          key={`cs-${i}`}
          points={c.points.map((p, j) => p + (j % 2 === 0 ? 0.8 : 0.8))}
          stroke="#00000066"
          strokeWidth={c.w + 1}
          opacity={op * 0.4}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      ))}
      {/* Main crack lines */}
      {cracks.map((c, i) => (
        <Line
          key={`c-${i}`}
          points={c.points}
          stroke={c.shade}
          strokeWidth={c.w}
          opacity={op * (1 - i * 0.05)}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      ))}
      {/* Highlight */}
      <Line
        points={[0, -s2 * 0.1, -2, 0, 1, s2 * 0.2]}
        stroke="#ffffff44"
        strokeWidth={0.5}
        opacity={op * 0.3}
        lineCap="round"
        listening={false}
      />
    </>
  );
};

export default CrackEffect;
