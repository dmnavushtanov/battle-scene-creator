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
  const smokeP = Math.max(0, (p - 0.4) / 0.6);

  return (
    <>
      {/* Outer shockwave */}
      <Circle x={0} y={0} radius={size * (0.5 + p * 1.5)} stroke="#ff880033" strokeWidth={6 * fadeOut} fill="transparent" opacity={fadeOut * intensity * 0.4} listening={false} />
      {/* Inner shockwave */}
      <Circle x={0} y={0} radius={size * (0.3 + p * 1.1)} stroke="#ff660044" strokeWidth={3 * fadeOut} fill="transparent" opacity={fadeOut * intensity * 0.5} listening={false} />
      {/* Secondary ring */}
      <Circle x={0} y={0} radius={size * (0.15 + p * 0.7)} stroke="#ffaa0055" strokeWidth={2 * fadeOut} fill="transparent" opacity={fadeOut * intensity * 0.3} listening={false} />
      {/* Core white flash */}
      <Circle x={0} y={0} radius={size * 0.4 * (1 - p * 0.6)} fill="#fffbe8" opacity={fadeOut * intensity * 0.95} listening={false} />
      {/* Orange fireball */}
      <Circle x={0} y={0} radius={size * 0.5 * (0.5 + p * 0.5)} fill="#ff6600" opacity={fadeOut * intensity * 0.7} listening={false} />
      {/* Red outer fireball */}
      <Circle x={0} y={0} radius={size * 0.6 * (0.3 + p * 0.7)} fill="#cc2200" opacity={fadeOut * intensity * 0.45} listening={false} />
      {/* Dark red bloom */}
      <Circle x={0} y={0} radius={size * 0.7 * (0.2 + p * 0.8)} fill="#88110044" opacity={fadeOut * intensity * 0.3} listening={false} />
      {/* Lingering smoke cloud */}
      {smokeP > 0 && (
        <>
          <Circle x={-3} y={-size * smokeP * 0.5} radius={size * (0.25 + smokeP * 0.5)} fill="#44444488" opacity={smokeP * intensity * 0.4 * (1 - smokeP * 0.3)} listening={false} />
          <Circle x={5} y={-size * smokeP * 0.35} radius={size * (0.18 + smokeP * 0.4)} fill="#55555566" opacity={smokeP * intensity * 0.3 * (1 - smokeP * 0.3)} listening={false} />
        </>
      )}
      {/* Debris particles — more of them */}
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i * 20 + seededRandom(i) * 15) * Math.PI / 180;
        const speed = 0.6 + seededRandom(i + 50) * 0.8;
        const dist = size * (0.15 + p * speed);
        const pSize = Math.max(0.5, (3 - p * 2.5) * (seededRandom(i + 100) * 0.5 + 0.5));
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        const colors = ['#ffcc00', '#ff8800', '#ff4400', '#ff2200', '#ffaa00'];
        return (
          <React.Fragment key={`exp-${i}`}>
            <Line points={[dx * 0.2, dy * 0.2, dx, dy]} stroke={colors[i % 5]} strokeWidth={1.2} opacity={fadeOut * intensity * 0.5} lineCap="round" listening={false} />
            <Circle x={dx} y={dy} radius={pSize} fill={colors[i % 5]} opacity={fadeOut * intensity * 0.85} listening={false} />
          </React.Fragment>
        );
      })}
      {/* Sparks — fast small particles */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i * 45 + seededRandom(i + 200) * 30) * Math.PI / 180;
        const dist = size * (0.3 + p * 1.2 * (0.8 + seededRandom(i + 300) * 0.4));
        const dx = Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        return (
          <Circle key={`spark-${i}`} x={dx} y={dy} radius={1} fill="#ffee88" opacity={fadeOut * intensity * 0.7} listening={false} />
        );
      })}
    </>
  );
};

export default ExplosionEffect;
