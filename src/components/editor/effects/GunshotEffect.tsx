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
  const fadeOut = Math.max(0, 1 - p * 2.5);
  const flashSize = size * 0.55 * (1 - p * 0.5);
  const smokeP = Math.max(0, (p - 0.25) / 0.75);

  return (
    <>
      {/* Outer glow */}
      <Circle x={size / 2 + 6} y={0} radius={flashSize * 1.8} fill="#ff880022" opacity={fadeOut * intensity * 0.5} listening={false} />
      {/* Muzzle flash — brighter */}
      <Circle x={size / 2 + 8} y={0} radius={flashSize} fill="#fffef0" opacity={fadeOut * intensity * 0.98} listening={false} />
      <Circle x={size / 2 + 12} y={0} radius={flashSize * 0.75} fill="#ffee00" opacity={fadeOut * intensity * 0.85} listening={false} />
      <Circle x={size / 2 + 6} y={0} radius={flashSize * 1.35} fill="#ff8800" opacity={fadeOut * intensity * 0.5} listening={false} />
      {/* Flash rays — more */}
      {[0, 25, -25, 12, -12, 40, -40].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const len = size * (0.5 + i * 0.05) * fadeOut;
        return (
          <Line
            key={`flash-${i}`}
            points={[size / 2 + 8, 0, size / 2 + 8 + Math.cos(rad) * len, Math.sin(rad) * len]}
            stroke={i < 3 ? '#ffee00' : '#ff8800'}
            strokeWidth={2 - i * 0.15}
            opacity={fadeOut * intensity * 0.7}
            lineCap="round"
            listening={false}
          />
        );
      })}
      {/* Spark particles */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = ((i * 60 + 15) * Math.PI) / 180;
        const dist = size * 0.3 * (0.3 + p * 0.8);
        const dx = size / 2 + 8 + Math.cos(angle) * dist;
        const dy = Math.sin(angle) * dist;
        return (
          <Circle key={`gspark-${i}`} x={dx} y={dy} radius={1.2} fill="#ffcc00" opacity={fadeOut * intensity * 0.6} listening={false} />
        );
      })}
      {/* Smoke puff after flash */}
      {smokeP > 0 && (
        <>
          <Circle x={size / 2 + 16 + smokeP * 12} y={-smokeP * 6} radius={5 + smokeP * 10} fill="#999999" opacity={intensity * 0.35 * (1 - smokeP)} listening={false} />
          <Circle x={size / 2 + 13 + smokeP * 7} y={-smokeP * 4} radius={4 + smokeP * 6} fill="#bbbbbb" opacity={intensity * 0.25 * (1 - smokeP)} listening={false} />
          <Circle x={size / 2 + 10 + smokeP * 4} y={-smokeP * 8} radius={3 + smokeP * 5} fill="#aaaaaa" opacity={intensity * 0.2 * (1 - smokeP)} listening={false} />
        </>
      )}
    </>
  );
};

export default GunshotEffect;
