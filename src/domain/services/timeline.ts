import type { Keyframe, ObjectSnapshot, MapObject } from '../models';

/**
 * Deterministic evaluation: given sorted keyframes for an object, returns
 * the interpolated transform at time `t`.
 * If no keyframes, returns the object's current static transform.
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

  // Before first keyframe
  if (t <= keyframes[0].time) {
    const k = keyframes[0];
    return { x: k.x, y: k.y, rotation: k.rotation, scaleX: k.scaleX, scaleY: k.scaleY, visible: k.visible };
  }

  // After last keyframe
  const last = keyframes[keyframes.length - 1];
  if (t >= last.time) {
    return { x: last.x, y: last.y, rotation: last.rotation, scaleX: last.scaleX, scaleY: last.scaleY, visible: last.visible };
  }

  // Find the two surrounding keyframes and lerp
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
        visible: a.visible, // snap visibility to the "from" keyframe
      };
    }
  }

  return { x: last.x, y: last.y, rotation: last.rotation, scaleX: last.scaleX, scaleY: last.scaleY, visible: last.visible };
}

/**
 * Insert or overwrite a keyframe at the given time in a sorted array.
 * Returns a new sorted array.
 */
export function upsertKeyframe(keyframes: Keyframe[], kf: Keyframe): Keyframe[] {
  const filtered = keyframes.filter((k) => Math.abs(k.time - kf.time) > 0.5); // dedupe within 0.5ms
  const result = [...filtered, kf];
  result.sort((a, b) => a.time - b.time);
  return result;
}
