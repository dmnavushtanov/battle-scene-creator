import type { EffectType, UnitEffect, ActiveEffect } from '../models';
import { v4 as uuid } from 'uuid';

/** Deterministic pseudo-random from a seed value */
export function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Calculate shake offset for units with active shake/explosion effects */
export function getShakeOffset(effects: ActiveEffect[], time: number): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  for (const eff of effects) {
    if ((eff.type === 'shake' || eff.type === 'explosion') && !eff.ended) {
      const amplitude = eff.intensity * 8;
      const decay = 1 - eff.progress;
      dx += Math.sin(time * 4.0 + Math.sin(time * 0.7) * 3) * amplitude * decay;
      dy += Math.cos(time * 5.3 + Math.cos(time * 0.9) * 2) * amplitude * decay;
    }
  }
  return { dx, dy };
}

export interface EffectPreset {
  type: EffectType;
  label: string;
  icon: string;
  description: string;
  defaultDuration: number;
  defaultIntensity: number;
  persistent: boolean;
}

export const EFFECT_PRESETS: EffectPreset[] = [
  {
    type: 'shake',
    label: 'Shake',
    icon: '〰️',
    description: 'Rapid vibration',
    defaultDuration: 500,
    defaultIntensity: 0.7,
    persistent: false,
  },
  {
    type: 'explosion',
    label: 'Explosion',
    icon: '💥',
    description: 'Burst + shake combo',
    defaultDuration: 800,
    defaultIntensity: 1.0,
    persistent: false,
  },
  {
    type: 'crack',
    label: 'Crack',
    icon: '⚡',
    description: 'Damage crack overlay',
    defaultDuration: 400,
    defaultIntensity: 0.8,
    persistent: true,
  },
  {
    type: 'blood',
    label: 'Blood',
    icon: '🩸',
    description: 'Red splatter overlay',
    defaultDuration: 600,
    defaultIntensity: 0.8,
    persistent: true,
  },
  {
    type: 'smoke',
    label: 'Smoke',
    icon: '💨',
    description: 'Fading smoke cloud',
    defaultDuration: 2000,
    defaultIntensity: 0.6,
    persistent: false,
  },
  {
    type: 'fire',
    label: 'Fire',
    icon: '🔥',
    description: 'Burning flames',
    defaultDuration: 3000,
    defaultIntensity: 0.7,
    persistent: false,
  },
  {
    type: 'gunshot',
    label: 'Gunshot',
    icon: '🔫',
    description: 'Musket muzzle flash + smoke',
    defaultDuration: 300,
    defaultIntensity: 1.0,
    persistent: false,
  },
];

export function createEffectFromPreset(preset: EffectPreset, startTime: number): UnitEffect {
  return {
    id: uuid(),
    type: preset.type,
    startTime,
    duration: preset.defaultDuration,
    intensity: preset.defaultIntensity,
    persistent: preset.persistent,
  };
}
