import type { ProjectData, Scene, Keyframe } from '../models';
import { v4 as uuid } from 'uuid';

const CURRENT_VERSION = '1.0';

export function exportProject(project: ProjectData): string {
  return JSON.stringify({ ...project, version: CURRENT_VERSION }, null, 2);
}

export function importProject(json: string): ProjectData {
  const data = JSON.parse(json);

  // Basic migration stub
  if (!data.version) {
    data.version = CURRENT_VERSION;
  }

  // Migrate from old flat format (pre-scene model)
  if (data.objects && !data.scenes) {
    const objectsById: Record<string, any> = {};
    const objectOrder: string[] = [];
    for (const obj of data.objects) {
      objectsById[obj.id] = obj;
      objectOrder.push(obj.id);
    }

    const keyframesByObjectId: Record<string, Keyframe[]> = {};
    if (data.keyframes) {
      for (const kf of data.keyframes) {
        if (!keyframesByObjectId[kf.objectId]) {
          keyframesByObjectId[kf.objectId] = [];
        }
        keyframesByObjectId[kf.objectId].push({
          time: kf.time,
          x: kf.x,
          y: kf.y,
          rotation: kf.rotation,
          scaleX: kf.scaleX,
          scaleY: kf.scaleY,
          visible: true,
        });
      }
    }

    const scene: Scene = {
      id: uuid(),
      name: 'Scene 1',
      duration: data.scenes?.[0]?.duration || 10000,
      backgroundImage: data.backgroundImage,
      objectsById,
      objectOrder,
      keyframesByObjectId,
      effectsByObjectId: {},
      narrationEvents: [],
      overlayEvents: [],
      soundEvents: [],
      groups: {},
    };

    return {
      version: CURRENT_VERSION,
      name: data.name || 'Imported Project',
      canvasWidth: data.canvasWidth || 1920,
      canvasHeight: data.canvasHeight || 1080,
      scenes: [scene],
    };
  }

  return data as ProjectData;
}
