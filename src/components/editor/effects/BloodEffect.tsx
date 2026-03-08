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
    { x: -1, y: 2, r: s2 * 0.3, color: '#8b0000' },
    { x: 4, y: -3, r: s2 * 0.22, color: '#a00000' },
    { x: -5, y: -1, r: s2 * 0.16, color: '#700000' },
    { x: 6, y: 5, r: s2 * 0.14, color: '#900000' },
    { x: -4, y: 7, r: s2 * 0.11, color: '#800000' },
    { x: 7, y: -5, r: s2 * 0.1, color: '#950000' },
    { x: -7, y: 4, r: s2 * 0.09, color: '#750000' },
  ];

  const drips = [
    { x: -2, sy: s2 * 0.2, ey: s2 * 0.8, w: 2.8 },
    { x: 3, sy: s2 * 0.1, ey: s2 * 0.65, w: 2.2 },
    { x: -5, sy: s2 * 0.05, ey: s2 * 0.5, w: 1.8 },
    { x: 6, sy: s2 * 0.15, ey: s2 * 0.55, w: 1.5 },
  ];

  return (
    <>
      {/* Shadow pool */}
      <Circle x={0} y={3} radius={s2 * 0.35} fill="#3a000033" opacity={op * 0.5} listening={false} />
      {/* Main splatters */}
      {splatters.map((sp, i) => (
        <React.Fragment key={`bl-${i}`}>
          <Circle x={sp.x} y={sp.y} radius={sp.r} fill={sp.color} opacity={op * (0.75 - i * 0.04)} listening={false} />
          <Circle x={sp.x + sp.r * 0.3} y={sp.y - sp.r * 0.2} radius={sp.r * 0.65} fill={sp.color} opacity={op * 0.5} listening={false} />
          <Circle x={sp.x - sp.r * 0.25} y={sp.y + sp.r * 0.35} radius={sp.r * 0.55} fill={sp.color} opacity={op * 0.45} listening={false} />
        </React.Fragment>
      ))}
      {/* Drip trails */}
      {drips.map((d, i) => (
        <React.Fragment key={`bd-${i}`}>
          <Line
            points={[d.x, d.sy, d.x - 0.5, (d.sy + d.ey) / 2, d.x + 0.3, d.ey]}
            stroke="#8b0000"
            strokeWidth={d.w}
            opacity={op * 0.65}
            lineCap="round"
            tension={0.4}
            listening={false}
          />
          <Circle x={d.x + 0.3} y={d.ey + 2} radius={d.w * 0.9} fill="#700000" opacity={op * 0.55} listening={false} />
        </React.Fragment>
      ))}
      {/* Specular highlight */}
      <Circle x={-1} y={1} radius={s2 * 0.1} fill="#ff4444" opacity={op * 0.25} listening={false} />
      {/* Tiny spray droplets */}
      {[{ x: 8, y: -7 }, { x: -9, y: 6 }, { x: 10, y: 3 }, { x: -8, y: -4 }, { x: 5, y: 9 }].map((d, i) => (
        <Circle key={`drop-${i}`} x={d.x} y={d.y} radius={1.2} fill="#8b0000" opacity={op * 0.4} listening={false} />
      ))}
    </>
  );
};

export default BloodEffect;
