import React from 'react';
import { Circle } from 'react-konva';
import type { ActiveEffect } from '@/domain/models';

interface SmokeEffectProps {
  size: number;
  effects: ActiveEffect[];
  currentTime: number;
}

const PUFFS = [
  { x: 0, y: 0, r: 14, delay: 0, shade: 100 },
  { x: -8, y: -3, r: 11, delay: 0.05, shade: 110 },
  { x: 7, y: -2, r: 12, delay: 0.08, shade: 105 },
  { x: -4, y: -8, r: 13, delay: 0.15, shade: 115 },
  { x: 5, y: -12, r: 10, delay: 0.2, shade: 120 },
  { x: -2, y: -18, r: 15, delay: 0.3, shade: 130 },
  { x: 6, y: -24, r: 12, delay: 0.35, shade: 135 },
  { x: -5, y: -30, r: 14, delay: 0.45, shade: 140 },
  { x: 3, y: -36, r: 10, delay: 0.55, shade: 150 },
  { x: -1, y: -42, r: 16, delay: 0.65, shade: 155 },
];

const SmokeEffect: React.FC<SmokeEffectProps> = ({ size, effects, currentTime }) => {
  const smokeEffect = effects.find((e) => e.type === 'smoke' && !e.ended);
  if (!smokeEffect) return null;

  const p = smokeEffect.progress;
  const intensity = smokeEffect.intensity;

  return (
    <>
      {PUFFS.map((puff, i) => {
        const localP = Math.max(0, Math.min(1, (p - puff.delay) / (1 - puff.delay)));
        if (localP <= 0) return null;

        const turbX = Math.sin(currentTime * 0.006 + i * 1.7) * 5 * localP + Math.sin(currentTime * 0.015 + i * 3.1) * 2 * localP;
        const turbY = Math.sin(currentTime * 0.004 + i * 2.3) * 2 * localP;
        const riseY = puff.y - localP * 30;
        const expandR = puff.r * (0.4 + localP * 1.0);
        const fadeIn = Math.min(1, localP * 4);
        const fadeFOut = Math.max(0, 1 - (localP - 0.6) / 0.4);
        const fadeOpacity = fadeIn * fadeFOut * intensity * 0.4;
        const g = puff.shade;

        return (
          <React.Fragment key={`smoke-${i}`}>
            <Circle x={puff.x + turbX + 1} y={riseY + turbY - size / 2 + 2} radius={expandR * 1.1} fill={`rgb(${g - 30},${g - 30},${g - 30})`} opacity={fadeOpacity * 0.3} listening={false} />
            <Circle x={puff.x + turbX} y={riseY + turbY - size / 2} radius={expandR} fill={`rgb(${g},${g},${g})`} opacity={fadeOpacity} listening={false} />
            <Circle x={puff.x + turbX - expandR * 0.2} y={riseY + turbY - size / 2 - expandR * 0.15} radius={expandR * 0.5} fill={`rgb(${g + 25},${g + 25},${g + 25})`} opacity={fadeOpacity * 0.5} listening={false} />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default SmokeEffect;
