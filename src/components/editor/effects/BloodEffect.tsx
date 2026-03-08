import React from 'react';
import { Circle, Line } from 'react-konva';
import type { ActiveEffect } from '@/domain/models';

interface BloodEffectProps {
  size: number;
  effects: ActiveEffect[];
}

const BloodEffect: React.FC<BloodEffectProps> = ({ size, effects }) => {
  const bloodEffect = effects.find((e) => e.type === 'blood');
  if (!bloodEffect) return null;

  const op = bloodEffect.ended ? 0.8 : Math.min(1, bloodEffect.progress * 2);
  const s2 = size / 2;

  const splatters = [
    { x: -1, y: 2, r: s2 * 0.25, color: '#8b0000' },
    { x: 3, y: -3, r: s2 * 0.18, color: '#a00000' },
    { x: -4, y: -1, r: s2 * 0.12, color: '#700000' },
    { x: 5, y: 4, r: s2 * 0.1, color: '#900000' },
    { x: -3, y: 6, r: s2 * 0.08, color: '#800000' },
  ];

  const drips = [
    { x: -2, sy: s2 * 0.2, ey: s2 * 0.7, w: 2.5 },
    { x: 3, sy: s2 * 0.1, ey: s2 * 0.55, w: 2 },
    { x: -5, sy: s2 * 0.05, ey: s2 * 0.45, w: 1.5 },
  ];

  return (
    <>
      <Circle x={0} y={2} radius={s2 * 0.3} fill="#4a000033" opacity={op * 0.5} listening={false} />
      {splatters.map((sp, i) => (
        <React.Fragment key={`bl-${i}`}>
          <Circle x={sp.x} y={sp.y} radius={sp.r} fill={sp.color} opacity={op * (0.7 - i * 0.05)} listening={false} />
          <Circle x={sp.x + sp.r * 0.3} y={sp.y - sp.r * 0.2} radius={sp.r * 0.6} fill={sp.color} opacity={op * 0.5} listening={false} />
          <Circle x={sp.x - sp.r * 0.25} y={sp.y + sp.r * 0.35} radius={sp.r * 0.5} fill={sp.color} opacity={op * 0.45} listening={false} />
        </React.Fragment>
      ))}
      {drips.map((d, i) => (
        <React.Fragment key={`bd-${i}`}>
          <Line
            points={[d.x, d.sy, d.x - 0.5, (d.sy + d.ey) / 2, d.x + 0.3, d.ey]}
            stroke="#8b0000"
            strokeWidth={d.w}
            opacity={op * 0.6}
            lineCap="round"
            tension={0.4}
            listening={false}
          />
          <Circle x={d.x + 0.3} y={d.ey + 2} radius={d.w * 0.8} fill="#700000" opacity={op * 0.5} listening={false} />
        </React.Fragment>
      ))}
      <Circle x={-1} y={1} radius={s2 * 0.08} fill="#ff4444" opacity={op * 0.2} listening={false} />
    </>
  );
};

export default BloodEffect;
