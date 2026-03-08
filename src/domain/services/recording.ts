import type { MapObject, Keyframe, ObjectSnapshot } from '../models';
import { upsertKeyframe } from './timeline';

export interface RecordingSession {
  startTime: number; // currentTime when recording started
  durationMs: number; // how long the recording represents in timeline time
  movedObjectIds: Set<string>;
  initialSnapshots: Record<string, ObjectSnapshot>;
}

export function createRecordingSession(startTime: number, durationMs: number): RecordingSession {
  return {
    startTime,
    durationMs,
    movedObjectIds: new Set(),
    initialSnapshots: {},
  };
}

/**
 * Called when an object is first moved during a recording session.
 * Captures its snapshot before the move.
 */
export function captureInitialSnapshot(
  session: RecordingSession,
  obj: MapObject
): void {
  if (!session.initialSnapshots[obj.id]) {
    session.initialSnapshots[obj.id] = {
      x: obj.x,
      y: obj.y,
      rotation: obj.rotation,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      visible: obj.visible,
    };
  }
  session.movedObjectIds.add(obj.id);
}

/**
 * Finalize a recording session: for each moved object, create keyframes at t0 and t1.
 * Returns updated keyframesByObjectId entries.
 */
export function finalizeRecording(
  session: RecordingSession,
  objectsById: Record<string, MapObject>,
  existingKeyframes: Record<string, Keyframe[]>
): Record<string, Keyframe[]> {
  const result = { ...existingKeyframes };
  const t0 = session.startTime;
  const t1 = t0 + session.durationMs;

  for (const objId of session.movedObjectIds) {
    const snapshot = session.initialSnapshots[objId];
    const obj = objectsById[objId];
    if (!snapshot || !obj) continue;

    const existing = result[objId] ? [...result[objId]] : [];

    // Remove all keyframes within the recorded range [t0, t1]
    // This ensures re-recording a segment cleanly replaces that portion
    const preserved = existing.filter((k) => k.time < t0 - 0.5 || k.time > t1 + 0.5);

    // Start keyframe from snapshot (position before drag)
    const startKf: Keyframe = {
      time: t0,
      x: snapshot.x,
      y: snapshot.y,
      rotation: snapshot.rotation,
      scaleX: snapshot.scaleX,
      scaleY: snapshot.scaleY,
      visible: snapshot.visible,
    };

    // End keyframe from current object position (after drag)
    const endKf: Keyframe = {
      time: t1,
      x: obj.x,
      y: obj.y,
      rotation: obj.rotation,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      visible: obj.visible,
    };

    result[objId] = upsertKeyframe(upsertKeyframe(preserved, startKf), endKf);
  }

  return result;
}
