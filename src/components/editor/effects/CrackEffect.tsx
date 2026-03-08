import React from 'react';
import { Line } from 'react-konva';
import type { ActiveEffect } from '@/domain/models';

interface CrackEffectProps {
  size: number;
  effects: ActiveEffect[];
}

/**
 * Shattered glass effect: radiating lines from a central impact point
 * with triangular shard edges and white highlight lines for refraction.
 */
const CrackEffect: React.FC<CrackEffectProps> = ({ size, effects }) => {
  const crackEffect = effects.find((e) => e.type === 'crack');
  if (!crackEffect) return null;

  const s2 = size / 2;
  const op = crackEffect.ended ? 0.9 : Math.min(1, crackEffect.progress * 2);

  // Main radiating crack lines from center impact
  const mainCracks: { points: number[]; w: number }[] = [
    { points: [0, 0, -s2 * 0.3, -s2 * 0.6, -s2 * 0.5, -s2 * 0.85], w: 2.0 },
    { points: [0, 0, s2 * 0.4, -s2 * 0.5, s2 * 0.55, -s2 * 0.8], w: 1.8 },
    { points: [0, 0, -s2 * 0.55, s2 * 0.3, -s2 * 0.8, s2 * 0.5], w: 1.6 },
    { points: [0, 0, s2 * 0.5, s2 * 0.4, s2 * 0.75, s2 * 0.6], w: 1.5 },
    { points: [0, 0, s2 * 0.1, -s2 * 0.7, s2 * 0.05, -s2 * 0.9], w: 1.4 },
    { points: [0, 0, -s2 * 0.6, -s2 * 0.1, -s2 * 0.85, 0], w: 1.3 },
    { points: [0, 0, s2 * 0.65, -s2 * 0.05, s2 * 0.9, s2 * 0.05], w: 1.2 },
    { points: [0, 0, -s2 * 0.1, s2 * 0.65, -s2 * 0.15, s2 * 0.85], w: 1.1 },
    { points: [0, 0, s2 * 0.2, s2 * 0.6, s2 * 0.3, s2 * 0.85], w: 1.0 },
  ];

  // Secondary branch cracks connecting main lines to form triangular shards
  const branchCracks: { points: number[]; w: number }[] = [
    { points: [-s2 * 0.3, -s2 * 0.6, s2 * 0.1, -s2 * 0.7], w: 0.8 },
    { points: [s2 * 0.4, -s2 * 0.5, s2 * 0.1, -s2 * 0.7], w: 0.7 },
    { points: [-s2 * 0.55, s2 * 0.3, -s2 * 0.1, s2 * 0.65], w: 0.7 },
    { points: [s2 * 0.5, s2 * 0.4, s2 * 0.2, s2 * 0.6], w: 0.6 },
    { points: [-s2 * 0.6, -s2 * 0.1, -s2 * 0.55, s2 * 0.3], w: 0.6 },
    { points: [s2 * 0.65, -s2 * 0.05, s2 * 0.5, s2 * 0.4], w: 0.5 },
    { points: [-s2 * 0.5, -s2 * 0.85, -s2 * 0.3, -s2 * 0.6], w: 0.5 },
    { points: [s2 * 0.55, -s2 * 0.8, s2 * 0.65, -s2 * 0.05], w: 0.5 },
    { points: [-s2 * 0.8, s2 * 0.5, -s2 * 0.15, s2 * 0.85], w: 0.4 },
    { points: [s2 * 0.75, s2 * 0.6, s2 * 0.3, s2 * 0.85], w: 0.4 },
  ];

  // White highlight lines for glass refraction effect
  const highlights: { points: number[]; w: number }[] = [
    { points: [0, 0, -s2 * 0.28, -s2 * 0.58], w: 0.5 },
    { points: [0, 0, s2 * 0.38, -s2 * 0.48], w: 0.5 },
    { points: [0, 0, s2 * 0.08, -s2 * 0.68], w: 0.4 },
    { points: [-s2 * 0.3, -s2 * 0.6, s2 * 0.08, -s2 * 0.68], w: 0.3 },
  ];

  return (
    <>
      {/* Drop shadow for depth */}
      {mainCracks.map((c, i) => (
        <Line
          key={`shadow-${i}`}
          points={c.points.map((p, j) => p + (j % 2 === 0 ? 1 : 1))}
          stroke="#00000066"
          strokeWidth={c.w + 1.5}
          opacity={op * 0.3}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      ))}

      {/* Main crack lines — dark gray */}
      {mainCracks.map((c, i) => (
        <Line
          key={`main-${i}`}
          points={c.points}
          stroke="#666666"
          strokeWidth={c.w}
          opacity={op * (1 - i * 0.03)}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      ))}

      {/* Branch cracks — lighter gray */}
      {branchCracks.map((c, i) => (
        <Line
          key={`branch-${i}`}
          points={c.points}
          stroke="#999999"
          strokeWidth={c.w}
          opacity={op * 0.8}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      ))}

      {/* White highlight refraction lines */}
      {highlights.map((c, i) => (
        <Line
          key={`highlight-${i}`}
          points={c.points}
          stroke="#ffffff"
          strokeWidth={c.w}
          opacity={op * 0.25}
          lineCap="round"
          lineJoin="round"
          listening={false}
        />
      ))}
    </>
  );
};

export default CrackEffect;
