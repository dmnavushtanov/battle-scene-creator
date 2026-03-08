import type { ProjectData } from '../models';

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
    const { v4: uuid } = require('uuid') as { v4: () => string };
    // Convert old format to scene-first
    const objectsById: Record<string, any> = {};
    const objectOrder: string[] = [];
    for (const obj of data.objects) {
      objectsById[obj.id] = obj;
      objectOrder.push(obj.id);
    }

    const keyframesByObjectId: Record<string, any[]> = {};
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

    const scene = {
      id: crypto.randomUUID?.() || 'scene-1',
      name: 'Scene 1',
      duration: data.scenes?.[0]?.duration || 10000,
      backgroundImage: data.backgroundImage,
      objectsById,
      objectOrder,
      keyframesByObjectId,
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
