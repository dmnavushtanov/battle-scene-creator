import React from 'react';
import { Circle, Line } from 'react-konva';
import type { ActiveEffect } from '@/domain/models';

interface GunshotEffectProps {
  size: number;
  effects: ActiveEffect[];
}

const GunshotEffect: React.FC<GunshotEffectProps> = ({ size, effects }) => {
  const gunshotEffect = effects.find((e) => e.type === 'gunshot' && !e.ended);
  if (!gunshotEffect) return null;

  const p = gunshotEffect.progress;
  const intensity = gunshotEffect.intensity;
  const fadeOut = Math.max(0, 1 - p * 2);
  const flashSize = size * 0.5 * (1 - p * 0.5);
  const smokeP = Math.max(0, (p - 0.3) / 0.7);

  return (
    <>
      {/* Muzzle flash */}
      <Circle x={size / 2 + 8} y={0} radius={flashSize} fill="#fffbe0" opacity={fadeOut * intensity * 0.95} listening={false} />
      <Circle x={size / 2 + 12} y={0} radius={flashSize * 0.7} fill="#ffdd00" opacity={fadeOut * intensity * 0.8} listening={false} />
      <Circle x={size / 2 + 6} y={0} radius={flashSize * 1.3} fill="#ff880044" opacity={fadeOut * intensity * 0.5} listening={false} />
      {/* Flash rays */}
      {[0, 30, -30, 15, -15].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const len = size * 0.6 * fadeOut;
        return (
          <Line
            key={`flash-${i}`}
            points={[size / 2 + 8, 0, size / 2 + 8 + Math.cos(rad) * len, Math.sin(rad) * len]}
            stroke="#ffdd00"
            strokeWidth={1.5 - i * 0.2}
            opacity={fadeOut * intensity * 0.6}
            lineCap="round"
            listening={false}
          />
        );
      })}
      {/* Smoke puff after flash */}
      {smokeP > 0 && (
        <>
          <Circle x={size / 2 + 15 + smokeP * 10} y={-smokeP * 5} radius={4 + smokeP * 8} fill="#aaaaaa" opacity={intensity * 0.3 * (1 - smokeP)} listening={false} />
          <Circle x={size / 2 + 12 + smokeP * 6} y={-smokeP * 3} radius={3 + smokeP * 5} fill="#cccccc" opacity={intensity * 0.2 * (1 - smokeP)} listening={false} />
        </>
      )}
    </>
  );
};

export default GunshotEffect;
