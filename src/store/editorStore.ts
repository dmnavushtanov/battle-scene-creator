import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { MapObject, Scene, Keyframe, ProjectData, DrawToolType, LayerType, ObjectSnapshot, UnitEffect, NarrationEvent, OverlayEvent, ActiveEffect } from '@/domain/models';
import { evaluateObjectAtTime, upsertKeyframe, evaluateEffectsAtTime } from '@/domain/services/timeline';
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
    effectsByObjectId: {},
    narrationEvents: [],
    overlayEvents: [],
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

export interface CustomIcon {
  id: string;
  label: string;
  dataUrl: string;
}

export interface EditorState {
  project: ProjectData;
  activeSceneId: string;
  selectedIds: string[];
  activeTool: DrawToolType;
  activeLayer: LayerType;
  currentTime: number;
  isPlaying: boolean;
  isRecording: boolean;
  recordingSession: RecordingSession | null;
  recordDurationSeconds: number;
  stageScale: number;
  stagePosition: { x: number; y: number };
  derivedTransforms: Record<string, ObjectSnapshot>;
  derivedEffects: Record<string, ActiveEffect[]>;
  activeNarrations: NarrationEvent[];
  activeOverlay: OverlayEvent | null;
  customIcons: CustomIcon[];

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

  // Effects
  addEffect: (objectId: string, effect: UnitEffect) => void;
  removeEffect: (objectId: string, effectId: string) => void;
  clearEffects: (objectId: string) => void;

  // Narration
  addNarration: (event: NarrationEvent) => void;
  updateNarration: (id: string, updates: Partial<NarrationEvent>) => void;
  removeNarration: (id: string) => void;

  // Overlays
  addOverlay: (event: OverlayEvent) => void;
  updateOverlay: (id: string, updates: Partial<OverlayEvent>) => void;
  removeOverlay: (id: string) => void;

  // Recording
  setRecordDurationSeconds: (dur: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  onObjectDragStart: (id: string) => void;
  onObjectDragMove: (id: string, x: number, y: number) => void;
  onObjectDragEnd: (id: string, x: number, y: number) => void;
  onGroupDragMove: (leadId: string, dx: number, dy: number) => void;

  // Zoom
  setStageScale: (scale: number) => void;
  setStagePosition: (pos: { x: number; y: number }) => void;

  // Scene
  setActiveSceneId: (id: string) => void;
  setSceneDuration: (ms: number) => void;

  // Playback engine
  computeDerivedTransforms: (time: number) => void;

  // Custom icons
  addCustomIcon: (icon: CustomIcon) => void;
  removeCustomIcon: (id: string) => void;

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
    derivedEffects: {},
    activeNarrations: [],
    activeOverlay: null,
    customIcons: [],

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
        const { [id]: ___, ...efRest } = scene.effectsByObjectId;
        return {
          ...scene,
          objectsById: rest,
          objectOrder: scene.objectOrder.filter((oid) => oid !== id),
          keyframesByObjectId: kfRest,
          effectsByObjectId: efRest,
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

    // Effects CRUD
    addEffect: (objectId, effect) => {
      get()._updateActiveScene((s) => ({
        ...s,
        effectsByObjectId: {
          ...s.effectsByObjectId,
          [objectId]: [...(s.effectsByObjectId[objectId] || []), effect],
        },
      }));
    },

    removeEffect: (objectId, effectId) => {
      get()._updateActiveScene((s) => ({
        ...s,
        effectsByObjectId: {
          ...s.effectsByObjectId,
          [objectId]: (s.effectsByObjectId[objectId] || []).filter((e) => e.id !== effectId),
        },
      }));
    },

    clearEffects: (objectId) => {
      get()._updateActiveScene((s) => {
        const { [objectId]: _, ...rest } = s.effectsByObjectId;
        return { ...s, effectsByObjectId: rest };
      });
    },

    // Narration CRUD
    addNarration: (event) => {
      get()._updateActiveScene((s) => ({
        ...s,
        narrationEvents: [...s.narrationEvents, event],
      }));
    },

    updateNarration: (id, updates) => {
      get()._updateActiveScene((s) => ({
        ...s,
        narrationEvents: s.narrationEvents.map((n) =>
          n.id === id ? { ...n, ...updates } : n
        ),
      }));
    },

    removeNarration: (id) => {
      get()._updateActiveScene((s) => ({
        ...s,
        narrationEvents: s.narrationEvents.filter((n) => n.id !== id),
      }));
    },

    // Overlay CRUD
    addOverlay: (event) => {
      get()._updateActiveScene((s) => ({
        ...s,
        overlayEvents: [...s.overlayEvents, event],
      }));
    },

    updateOverlay: (id, updates) => {
      get()._updateActiveScene((s) => ({
        ...s,
        overlayEvents: s.overlayEvents.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      }));
    },

    removeOverlay: (id) => {
      get()._updateActiveScene((s) => ({
        ...s,
        overlayEvents: s.overlayEvents.filter((o) => o.id !== id),
      }));
    },

    setRecordDurationSeconds: (dur) => set({ recordDurationSeconds: dur }),

    startRecording: () => {
      const { currentTime, recordDurationSeconds, derivedTransforms } = get();
      const durationMs = recordDurationSeconds * 1000;
      const endTime = currentTime + durationMs;

      const scene = get().getActiveScene();
      if (endTime > scene.duration) {
        get()._updateActiveScene((s) => ({ ...s, duration: Math.ceil(endTime / 1000) * 1000 }));
      }

      if (Object.keys(derivedTransforms).length > 0) {
        get()._updateActiveScene((s) => {
          const updated = { ...s.objectsById };
          for (const [id, snap] of Object.entries(derivedTransforms)) {
            if (updated[id]) {
              updated[id] = { ...updated[id], x: snap.x, y: snap.y, rotation: snap.rotation, scaleX: snap.scaleX, scaleY: snap.scaleY };
            }
          }
          return { ...s, objectsById: updated };
        });
      }

      set({
        isRecording: true,
        recordingSession: createRecordingSession(currentTime, durationMs),
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
      const effects: Record<string, ActiveEffect[]> = {};

      for (const id of scene.objectOrder) {
        const obj = scene.objectsById[id];
        if (!obj) continue;
        const kfs = scene.keyframesByObjectId[id];
        transforms[id] = evaluateObjectAtTime(obj, kfs, time);
        const effs = scene.effectsByObjectId[id];
        const activeEffects = evaluateEffectsAtTime(effs, time);
        if (activeEffects.length > 0) {
          effects[id] = activeEffects;
        }
      }

      // Active narrations
      const activeNarrations = (scene.narrationEvents || []).filter(
        (n) => time >= n.startTime && time <= n.startTime + n.duration
      );

      // Active overlay (only the first one if overlapping)
      const activeOverlay = (scene.overlayEvents || []).find(
        (o) => time >= o.startTime && time <= o.startTime + o.duration
      ) || null;

      set({ derivedTransforms: transforms, derivedEffects: effects, activeNarrations, activeOverlay });
    },

    addCustomIcon: (icon) => set((s) => ({ customIcons: [...s.customIcons, icon] })),
    removeCustomIcon: (id) => set((s) => ({ customIcons: s.customIcons.filter((i) => i.id !== id) })),

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
          derivedEffects: {},
          activeNarrations: [],
          activeOverlay: null,
        });
      } catch (e) {
        console.error('Invalid project JSON', e);
      }
    },
  };
});
