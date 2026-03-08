import React from 'react';
import { Circle, Line } from 'react-konva';
import type { ActiveEffect } from '@/domain/models';
import { seededRandom } from '@/domain/services/effects';

interface ExplosionEffectProps {
  size: number;
  effects: ActiveEffect[];
}

const ExplosionEffect: React.FC<ExplosionEffectProps> = ({ size, effects }) => {
  const explosionEffect = effects.find((e) => e.type === 'explosion' && !e.ended);
  if (!explosionEffect) return null;

  const p = explosionEffect.progress;
  const intensity = explosionEffect.intensity;
  const fadeOut = Math.max(0, 1 - p * 1.2);

  return (
    <>
      {/* Shockwave rings */}
      <Circle x={0} y={0} radius={size * (0.4 + p * 1.2)} stroke="#ff880044" strokeWidth={4 * fadeOut} fill="transparent" opacity={fadeOut * intensity * 0.5} listening={false} />
      <Circle x={0} y={0} radius={size * (0.2 + p * 0.9)} stroke="#ff660033" strokeWidth={2 * fadeOut} fill="transparent" opacity={fadeOut * intensity * 0.4} listening={false} />
      {/* Core flash */}
      <Circle x={0} y={0} radius={size * 0.35 * (1 - p * 0.6)} fill="#fffbe8" opacity={fadeOut * intensity * 0.95} listening={false} />
      <Circle x={0} y={0} radius={size * 0.45 * (0.5 + p * 0.5)} fill="#ff6600" opacity={fadeOut * intensity * 0.65} listening={false} />
      <Circle x={0} y={0} radius={size * 0.55 * (0.3 + p * 0.7)} fill="#cc220088" opacity={fadeOut * intensity * 0.45} listening={false} />
      {/* Smoke */}
      <Circle x={0} y={-size * p * 0.3} radius={size * (0.2 + p * 0.6)} fill="#44444488" opacity={p * intensity * 0.35} listening={false} />
      {/* Debris particles */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 + seededRandom(i) * 20) * Math.PI / 180;
        const speed = 0.7 + seededRandom(i + 50) * 0.6;
        const dist = size * (0.15 + p * speed);
        const pSize = Math.max(0.5, (2.5 - p * 2) * (seededRandom(i + 100) * 0.5 + 0.5));
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const colors = ['#ffcc00', '#ff8800', '#ff4400', '#ff2200'];
        return (
          <React.Fragment key={`exp-${i}`}>
            <Line points={[dx * 0.3, dy * 0.3, dx, dy]} stroke={colors[i % 4]} strokeWidth={1} opacity={fadeOut * intensity * 0.4} lineCap="round" listening={false} />
            <Circle x={dx} y={dy} radius={pSize} fill={colors[i % 4]} opacity={fadeOut * intensity * 0.8} listening={false} />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default ExplosionEffect;
