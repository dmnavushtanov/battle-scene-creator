import { beforeEach, describe, expect, it } from 'vitest';
import type { MapObject, ProjectData, Scene } from '@/domain/models';
import { evaluateObjectAtTime } from '@/domain/services/timeline';
import { useEditorStore } from './editorStore';

function makeScene(): Scene {
  return {
    id: 'scene-1',
    name: 'Scene 1',
    duration: 10000,
    objectsById: {},
    objectOrder: [],
    keyframesByObjectId: {},
    effectsByObjectId: {},
    narrationEvents: [],
    overlayEvents: [],
    soundEvents: [],
    groups: {},
  };
}

function makeProject(): ProjectData {
  return {
    version: '1.0',
    name: 'Test Project',
    canvasWidth: 1920,
    canvasHeight: 1080,
    scenes: [makeScene()],
  };
}

describe('replaceKeyframesFromTime', () => {
  beforeEach(() => {
    useEditorStore.setState({
      project: makeProject(),
      activeSceneId: 'scene-1',
      currentTime: 0,
      selectedIds: [],
    });
  });

  it('overwrites future movement and keeps interpolation stable', () => {
    const objectId = 'unit-1';
    const obj: MapObject = {
      id: objectId,
      type: 'unit',
      unitType: 'infantry',
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      layer: 'units',
      visible: true,
      locked: false,
    };

    const store = useEditorStore.getState();
    store.addObject(obj);
    store.batchAddKeyframes(objectId, [
      { time: 0, x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true },
      { time: 1000, x: 100, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true },
      { time: 2000, x: 200, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true },
    ]);

    store.replaceKeyframesFromTime(objectId, 1000, [
      { time: 1000, x: 100, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true },
      { time: 1500, x: 150, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true },
    ]);

    const scene = useEditorStore.getState().getActiveScene();
    const keyframes = scene.keyframesByObjectId[objectId];
    expect(keyframes.map((kf) => kf.time)).toEqual([0, 1000, 1500]);

    const at1250 = evaluateObjectAtTime(obj, keyframes, 1250);
    expect(at1250.x).toBe(125);

    const afterReplacedEnd = evaluateObjectAtTime(obj, keyframes, 2500);
    expect(afterReplacedEnd.x).toBe(150);
  });
});
