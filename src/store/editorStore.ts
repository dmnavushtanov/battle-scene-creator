import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { MapObject, Scene, Keyframe, ProjectData, DrawToolType, LayerType, ObjectSnapshot } from '@/domain/models';
import { evaluateObjectAtTime, upsertKeyframe } from '@/domain/services/timeline';
import { createRecordingSession, captureInitialSnapshot, finalizeRecording, type RecordingSession } from '@/domain/services/recording';
import { exportProject as serializeProject, importProject as deserializeProject } from '@/domain/services/serialization';

function createDefaultScene(): Scene {
  return {
    id: uuid(),
    name: 'Scene 1',
    duration: 10000,
    objectsById: {},
    objectOrder: [],
    keyframesByObjectId: {},
  };
}

function createDefaultProject(): ProjectData {
  return {
    version: '1.0',
    name: 'Untitled Battle',
    canvasWidth: 1920,
    canvasHeight: 1080,
    scenes: [createDefaultScene()],
  };
}

export interface EditorState {
  project: ProjectData;
  activeSceneId: string;
  selectedIds: string[];
  activeTool: DrawToolType;
  activeLayer: LayerType;
  currentTime: number;
  isPlaying: boolean;
  // Recording
  isRecording: boolean;
  recordingSession: RecordingSession | null;
  recordDurationSeconds: number;
  // Zoom/Pan
  stageScale: number;
  stagePosition: { x: number; y: number };
  // Derived transforms during playback/scrub (not persisted)
  derivedTransforms: Record<string, ObjectSnapshot>;

  // Scene helpers
  getActiveScene: () => Scene;
  _updateActiveScene: (updater: (scene: Scene) => Scene) => void;

  // Object CRUD
  addObject: (obj: MapObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<MapObject>) => void;

  // Selection
  setSelectedIds: (ids: string[]) => void;
  setActiveTool: (tool: DrawToolType) => void;
  setActiveLayer: (layer: LayerType) => void;

  // Timeline
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  seekTo: (time: number) => void;

  // Background
  setBackgroundImage: (url: string) => void;

  // Keyframes
  addKeyframeAtTime: (objectId: string, time: number) => void;
  clearKeyframes: (objectId: string) => void;
  clearAllKeyframes: () => void;

  // Recording
  setRecordDurationSeconds: (dur: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  onObjectDragStart: (id: string) => void;
  onObjectDragMove: (id: string, x: number, y: number) => void;
  onObjectDragEnd: (id: string, x: number, y: number) => void;

  // Group drag
  onGroupDragMove: (leadId: string, dx: number, dy: number) => void;

  // Zoom
  setStageScale: (scale: number) => void;
  setStagePosition: (pos: { x: number; y: number }) => void;

  // Scene
  setActiveSceneId: (id: string) => void;
  setSceneDuration: (ms: number) => void;

  // Playback engine
  computeDerivedTransforms: (time: number) => void;

  // Import/Export
  exportProject: () => string;
  importProject: (json: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => {
  const defaultProject = createDefaultProject();

  return {
    project: defaultProject,
    activeSceneId: defaultProject.scenes[0].id,
    selectedIds: [],
    activeTool: 'select',
    activeLayer: 'units',
    currentTime: 0,
    isPlaying: false,
    isRecording: false,
    recordingSession: null,
    recordDurationSeconds: 2.0,
    stageScale: 1,
    stagePosition: { x: 0, y: 0 },
    derivedTransforms: {},

    getActiveScene: () => {
      const { project, activeSceneId } = get();
      return project.scenes.find((s) => s.id === activeSceneId) || project.scenes[0];
    },

    _updateActiveScene: (updater) => {
      const { project, activeSceneId } = get();
      set({
        project: {
          ...project,
          scenes: project.scenes.map((s) =>
            s.id === activeSceneId ? updater(s) : s
          ),
        },
      });
    },

    addObject: (obj) => {
      get()._updateActiveScene((scene) => ({
        ...scene,
        objectsById: { ...scene.objectsById, [obj.id]: obj },
        objectOrder: [...scene.objectOrder, obj.id],
      }));
    },

    removeObject: (id) => {
      get()._updateActiveScene((scene) => {
        const { [id]: _, ...rest } = scene.objectsById;
        const { [id]: __, ...kfRest } = scene.keyframesByObjectId;
        return {
          ...scene,
          objectsById: rest,
          objectOrder: scene.objectOrder.filter((oid) => oid !== id),
          keyframesByObjectId: kfRest,
        };
      });
      set((s) => ({ selectedIds: s.selectedIds.filter((sid) => sid !== id) }));
    },

    updateObject: (id, updates) => {
      get()._updateActiveScene((scene) => {
        const existing = scene.objectsById[id];
        if (!existing) return scene;
        return {
          ...scene,
          objectsById: { ...scene.objectsById, [id]: { ...existing, ...updates } },
        };
      });
    },

    setSelectedIds: (ids) => set({ selectedIds: ids }),
    setActiveTool: (tool) => set({ activeTool: tool }),
    setActiveLayer: (layer) => set({ activeLayer: layer }),

    setCurrentTime: (time) => set({ currentTime: time }),
    setIsPlaying: (playing) => set({ isPlaying: playing }),

    seekTo: (time) => {
      set({ currentTime: time });
      get().computeDerivedTransforms(time);
    },

    setBackgroundImage: (url) => {
      get()._updateActiveScene((scene) => ({ ...scene, backgroundImage: url }));
    },

    addKeyframeAtTime: (objectId, time) => {
      const scene = get().getActiveScene();
      const obj = scene.objectsById[objectId];
      if (!obj) return;
      const kf: Keyframe = {
        time,
        x: obj.x,
        y: obj.y,
        rotation: obj.rotation,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        visible: obj.visible,
      };
      get()._updateActiveScene((s) => ({
        ...s,
        keyframesByObjectId: {
          ...s.keyframesByObjectId,
          [objectId]: upsertKeyframe(s.keyframesByObjectId[objectId] || [], kf),
        },
      }));
    },

    clearKeyframes: (objectId) => {
      get()._updateActiveScene((s) => {
        const { [objectId]: _, ...rest } = s.keyframesByObjectId;
        return { ...s, keyframesByObjectId: rest };
      });
    },

    clearAllKeyframes: () => {
      get()._updateActiveScene((s) => ({ ...s, keyframesByObjectId: {} }));
    },

    setRecordDurationSeconds: (dur) => set({ recordDurationSeconds: dur }),

    startRecording: () => {
      const { currentTime, recordDurationSeconds } = get();
      set({
        isRecording: true,
        recordingSession: createRecordingSession(currentTime, recordDurationSeconds * 1000),
      });
    },

    stopRecording: () => {
      const { recordingSession } = get();
      if (!recordingSession) {
        set({ isRecording: false, recordingSession: null });
        return;
      }
      const scene = get().getActiveScene();
      const updatedKeyframes = finalizeRecording(
        recordingSession,
        scene.objectsById,
        scene.keyframesByObjectId
      );
      get()._updateActiveScene((s) => ({
        ...s,
        keyframesByObjectId: updatedKeyframes,
      }));
      // Advance playhead to end of recorded segment so next recording appends
      const newTime = recordingSession.startTime + recordingSession.durationMs;
      set({ isRecording: false, recordingSession: null, currentTime: newTime });
      get().computeDerivedTransforms(newTime);
    },

    onObjectDragStart: (id) => {
      const { isRecording, recordingSession } = get();
      if (!isRecording || !recordingSession) return;
      const scene = get().getActiveScene();
      const obj = scene.objectsById[id];
      if (!obj) return;
      captureInitialSnapshot(recordingSession, obj);
      // Also capture snapshots for other selected objects (group move)
      const { selectedIds } = get();
      if (selectedIds.includes(id) && selectedIds.length > 1) {
        for (const sid of selectedIds) {
          if (sid !== id) {
            const sObj = scene.objectsById[sid];
            if (sObj) captureInitialSnapshot(recordingSession, sObj);
          }
        }
      }
    },

    onObjectDragMove: (id, x, y) => {
      // Lightweight: only update the single object in objectsById
      const scene = get().getActiveScene();
      const obj = scene.objectsById[id];
      if (!obj) return;
      get()._updateActiveScene((s) => ({
        ...s,
        objectsById: { ...s.objectsById, [id]: { ...obj, x, y } },
      }));
    },

    onObjectDragEnd: (id, x, y) => {
      get().onObjectDragMove(id, x, y);
    },

    onGroupDragMove: (leadId, dx, dy) => {
      const { selectedIds, isRecording, recordingSession } = get();
      if (!selectedIds.includes(leadId) || selectedIds.length <= 1) return;
      const scene = get().getActiveScene();
      const updates: Record<string, MapObject> = {};
      for (const sid of selectedIds) {
        if (sid === leadId) continue;
        const obj = scene.objectsById[sid];
        if (!obj || obj.locked) continue;
        // On first move during recording, capture snapshots
        if (isRecording && recordingSession) {
          captureInitialSnapshot(recordingSession, obj);
        }
        updates[sid] = { ...obj, x: obj.x + dx, y: obj.y + dy };
      }
      if (Object.keys(updates).length > 0) {
        get()._updateActiveScene((s) => ({
          ...s,
          objectsById: { ...s.objectsById, ...updates },
        }));
      }
    },

    setStageScale: (scale) => set({ stageScale: scale }),
    setStagePosition: (pos) => set({ stagePosition: pos }),

    setActiveSceneId: (id) => set({ activeSceneId: id }),
    setSceneDuration: (ms) => {
      get()._updateActiveScene((s) => ({ ...s, duration: ms }));
    },

    computeDerivedTransforms: (time) => {
      const scene = get().getActiveScene();
      const transforms: Record<string, ObjectSnapshot> = {};
      for (const id of scene.objectOrder) {
        const obj = scene.objectsById[id];
        if (!obj) continue;
        const kfs = scene.keyframesByObjectId[id];
        transforms[id] = evaluateObjectAtTime(obj, kfs, time);
      }
      set({ derivedTransforms: transforms });
    },

    exportProject: () => serializeProject(get().project),

    importProject: (json) => {
      try {
        const data = deserializeProject(json);
        set({
          project: data,
          activeSceneId: data.scenes[0]?.id || '',
          selectedIds: [],
          currentTime: 0,
          isPlaying: false,
          isRecording: false,
          recordingSession: null,
          derivedTransforms: {},
        });
      } catch (e) {
        console.error('Invalid project JSON', e);
      }
    },
  };
});
