import type { EffectType, UnitEffect } from '../models';
import { v4 as uuid } from 'uuid';

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
