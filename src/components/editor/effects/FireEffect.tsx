import React from 'react';
import { Circle } from 'react-konva';
import type { ActiveEffect } from '@/domain/models';

interface FireEffectProps {
  size: number;
  effects: ActiveEffect[];
  currentTime: number;
}

const FireEffect: React.FC<FireEffectProps> = ({ size, effects, currentTime }) => {
  const fireEffect = effects.find((e) => e.type === 'fire' && !e.ended);
  if (!fireEffect) return null;

  const intensity = fireEffect.intensity;
  const baseY = -size / 2;

  const flames = [
    { x: 0, y: baseY, h: 24, w: 9, speed: 0.02, color: '#ff2200', delay: 0 },
    { x: -6, y: baseY + 2, h: 20, w: 7, speed: 0.025, color: '#ff4400', delay: 0.1 },
    { x: 6, y: baseY + 1, h: 22, w: 8, speed: 0.022, color: '#ff3300', delay: 0.05 },
    { x: -3, y: baseY - 2, h: 18, w: 6, speed: 0.03, color: '#ff6600', delay: 0.15 },
    { x: 4, y: baseY - 4, h: 16, w: 6, speed: 0.028, color: '#ff8800', delay: 0.12 },
    { x: 0, y: baseY - 8, h: 14, w: 5, speed: 0.035, color: '#ffaa00', delay: 0.2 },
    { x: -2, y: baseY - 12, h: 12, w: 4, speed: 0.04, color: '#ffcc33', delay: 0.25 },
    { x: 2, y: baseY - 14, h: 10, w: 3, speed: 0.045, color: '#ffdd66', delay: 0.3 },
    { x: -5, y: baseY + 3, h: 15, w: 5, speed: 0.032, color: '#ff5500', delay: 0.08 },
    { x: 5, y: baseY - 1, h: 17, w: 6, speed: 0.027, color: '#ff7700', delay: 0.18 },
  ];

  return (
    <>
      {/* Heat haze distortion */}
      <Circle x={0} y={baseY - 20} radius={size * 0.6} fill="#ff440008" opacity={intensity * 0.3} listening={false} />
      {/* Ground glow */}
      <Circle x={0} y={baseY + 6} radius={size * 0.5} fill="#ff440015" opacity={intensity * 0.6} listening={false} />
      <Circle x={0} y={baseY + 2} radius={size * 0.35} fill="#ff660025" opacity={intensity * 0.5} listening={false} />
      {/* Flames */}
      {flames.map((f, i) => {
        const flicker = Math.sin(currentTime * f.speed + i * 2.7) * 3.5;
        const yFlicker = Math.sin(currentTime * f.speed * 1.4 + i * 1.3) * 3;
        const hFlicker = Math.sin(currentTime * f.speed * 0.9 + i * 0.5) * 2.5;
        const wFlicker = Math.sin(currentTime * f.speed * 1.1 + i * 1.8) * 1.2;
        const fx = f.x + flicker;
        const fy = f.y + yFlicker;
        const fh = f.h + hFlicker;
        const fw = f.w + wFlicker;
        const flickerOpacity = 0.55 + Math.sin(currentTime * f.speed * 1.6 + i * 0.9) * 0.15;
        return (
          <React.Fragment key={`fire-${i}`}>
            <Circle x={fx} y={fy - fh * 0.3} radius={fw * 1.6} fill={f.color + '18'} opacity={intensity * flickerOpacity * 0.3} listening={false} />
            <Circle x={fx} y={fy - fh * 0.5} radius={fw * 1.1} fill={f.color} opacity={intensity * flickerOpacity} listening={false} />
            <Circle x={fx} y={fy - fh * 0.3} radius={fw * 0.85} fill={f.color} opacity={intensity * flickerOpacity * 0.9} listening={false} />
            <Circle x={fx} y={fy} radius={fw * 0.65} fill={f.color} opacity={intensity * flickerOpacity * 0.7} listening={false} />
          </React.Fragment>
        );
      })}
      {/* Hot core */}
      <Circle x={0} y={baseY + 2} radius={5} fill="#fff8e0" opacity={intensity * 0.7} listening={false} />
      <Circle x={0} y={baseY} radius={3} fill="#ffffff" opacity={intensity * 0.4} listening={false} />
      {/* Embers / sparks rising */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const emberY = baseY - 22 - Math.sin(currentTime * 0.012 + i * 2) * 18;
        const emberX = Math.sin(currentTime * 0.009 + i * 3) * 10;
        const sparkle = 0.4 + Math.sin(currentTime * 0.025 + i * 1.5) * 0.4;
        return (
          <Circle key={`ember-${i}`} x={emberX} y={emberY} radius={1.4} fill={i % 2 === 0 ? '#ffcc00' : '#ff8800'} opacity={intensity * sparkle} listening={false} />
        );
      })}
    </>
  );
};

export default FireEffect;
