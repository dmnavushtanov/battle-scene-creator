import type { Keyframe, ObjectSnapshot, MapObject, UnitEffect, ActiveEffect } from '../models';

/**
 * Deterministic evaluation: given sorted keyframes for an object, returns
 * the interpolated transform at time `t`.
 */
export function evaluateObjectAtTime(
  obj: MapObject,
  keyframes: Keyframe[] | undefined,
  t: number
): ObjectSnapshot {
  if (!keyframes || keyframes.length === 0) {
    return {
      x: obj.x,
      y: obj.y,
      rotation: obj.rotation,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      visible: obj.visible,
    };
  }

  if (t <= keyframes[0].time) {
    const k = keyframes[0];
    return { x: k.x, y: k.y, rotation: k.rotation, scaleX: k.scaleX, scaleY: k.scaleY, visible: k.visible };
  }

  const last = keyframes[keyframes.length - 1];
  if (t >= last.time) {
    return { x: last.x, y: last.y, rotation: last.rotation, scaleX: last.scaleX, scaleY: last.scaleY, visible: last.visible };
  }

  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i];
    const b = keyframes[i + 1];
    if (t >= a.time && t <= b.time) {
      const ratio = (t - a.time) / (b.time - a.time);
      return {
        x: a.x + (b.x - a.x) * ratio,
        y: a.y + (b.y - a.y) * ratio,
        rotation: a.rotation + (b.rotation - a.rotation) * ratio,
        scaleX: a.scaleX + (b.scaleX - a.scaleX) * ratio,
        scaleY: a.scaleY + (b.scaleY - a.scaleY) * ratio,
        visible: a.visible,
      };
    }
  }

  return { x: last.x, y: last.y, rotation: last.rotation, scaleX: last.scaleX, scaleY: last.scaleY, visible: last.visible };
}

/**
 * Insert or overwrite a keyframe at the given time in a sorted array.
 */
export function upsertKeyframe(keyframes: Keyframe[], kf: Keyframe): Keyframe[] {
  const filtered = keyframes.filter((k) => Math.abs(k.time - kf.time) > 0.5);
  const result = [...filtered, kf];
  result.sort((a, b) => a.time - b.time);
  return result;
}

/**
 * Evaluate which effects are active for a given object at time `t`.
 * Returns an array of active effects with their progress.
 */
export function evaluateEffectsAtTime(
  effects: UnitEffect[] | undefined,
  t: number
): ActiveEffect[] {
  if (!effects || effects.length === 0) return [];

  const active: ActiveEffect[] = [];

  for (const effect of effects) {
    const endTime = effect.startTime + effect.duration;
    const isActive = t >= effect.startTime && t <= endTime;
    const hasEnded = t > endTime;

    if (isActive) {
      const progress = (t - effect.startTime) / Math.max(effect.duration, 1);
      active.push({
        type: effect.type,
        progress: Math.min(1, Math.max(0, progress)),
        intensity: effect.intensity,
        persistent: effect.persistent,
        ended: false,
      });
    } else if (hasEnded && effect.persistent) {
      // Persistent effects remain visible after ending (crack, blood)
      active.push({
        type: effect.type,
        progress: 1,
        intensity: effect.intensity,
        persistent: true,
        ended: true,
      });
    }
  }

  return active;
}
