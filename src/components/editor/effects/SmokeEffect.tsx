import React from 'react';
import { Circle } from 'react-konva';
import type { ActiveEffect } from '@/domain/models';

interface SmokeEffectProps {
  size: number;
  effects: ActiveEffect[];
  currentTime: number;
}

const PUFFS = [
  { x: 0, y: 0, r: 18, delay: 0, shade: 100 },
  { x: -9, y: -3, r: 15, delay: 0.02, shade: 110 },
  { x: 8, y: -2, r: 14, delay: 0.04, shade: 105 },
  { x: -5, y: -7, r: 16, delay: 0.06, shade: 115 },
  { x: 6, y: -10, r: 13, delay: 0.08, shade: 120 },
  { x: -3, y: -15, r: 18, delay: 0.12, shade: 130 },
  { x: 7, y: -20, r: 15, delay: 0.16, shade: 135 },
  { x: -6, y: -26, r: 17, delay: 0.22, shade: 140 },
  { x: 4, y: -32, r: 14, delay: 0.3, shade: 150 },
  { x: -2, y: -38, r: 20, delay: 0.38, shade: 155 },
  { x: 3, y: -44, r: 16, delay: 0.45, shade: 145 },
  { x: -4, y: -50, r: 18, delay: 0.5, shade: 160 },
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

        const turbX = Math.sin(currentTime * 0.006 + i * 1.7) * 6 * localP + Math.sin(currentTime * 0.015 + i * 3.1) * 3 * localP;
        const turbY = Math.sin(currentTime * 0.004 + i * 2.3) * 3 * localP;
        const riseY = puff.y - localP * 35;
        const expandR = puff.r * (0.5 + localP * 1.2);
        const fadeIn = Math.min(1, localP * 3);
        const fadeFOut = Math.max(0, 1 - (localP - 0.5) / 0.5);
        const fadeOpacity = fadeIn * fadeFOut * intensity * 0.65;
        const g = puff.shade;

        return (
          <React.Fragment key={`smoke-${i}`}>
            <Circle x={puff.x + turbX + 1} y={riseY + turbY - size / 2 + 2} radius={expandR * 1.15} fill={`rgb(${g - 30},${g - 30},${g - 30})`} opacity={fadeOpacity * 0.35} listening={false} />
            <Circle x={puff.x + turbX} y={riseY + turbY - size / 2} radius={expandR} fill={`rgb(${g},${g},${g})`} opacity={fadeOpacity} listening={false} />
            <Circle x={puff.x + turbX - expandR * 0.2} y={riseY + turbY - size / 2 - expandR * 0.15} radius={expandR * 0.55} fill={`rgb(${g + 25},${g + 25},${g + 25})`} opacity={fadeOpacity * 0.55} listening={false} />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default SmokeEffect;
