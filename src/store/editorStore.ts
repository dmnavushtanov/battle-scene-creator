import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { EditorState, MapObject, Keyframe, Scene } from '@/types/editor';

const defaultScene: Scene = {
  id: uuid(),
  name: 'Scene 1',
  duration: 10000,
  order: 0,
};

export const useEditorStore = create<EditorState>((set, get) => ({
  project: {
    name: 'Untitled Battle',
    canvasWidth: 1920,
    canvasHeight: 1080,
    objects: [],
    keyframes: [],
    scenes: [defaultScene],
  },
  selectedIds: [],
  activeTool: 'select',
  activeLayer: 'units',
  currentTime: 0,
  isPlaying: false,
  activeSceneId: defaultScene.id,
  isRecording: false,
  recordingStartTime: 0,
  recordingStartPositions: {},
  stageScale: 1,
  stagePosition: { x: 0, y: 0 },

  addObject: (obj) =>
    set((s) => ({ project: { ...s.project, objects: [...s.project.objects, obj] } })),

  removeObject: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        objects: s.project.objects.filter((o) => o.id !== id),
        keyframes: s.project.keyframes.filter((k) => k.objectId !== id),
      },
      selectedIds: s.selectedIds.filter((sid) => sid !== id),
    })),

  updateObject: (id, updates) =>
    set((s) => ({
      project: {
        ...s.project,
        objects: s.project.objects.map((o) => (o.id === id ? { ...o, ...updates } : o)),
      },
    })),

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setStageScale: (scale) => set({ stageScale: scale }),
  setStagePosition: (pos) => set({ stagePosition: pos }),

  setBackgroundImage: (url) =>
    set((s) => ({ project: { ...s.project, backgroundImage: url } })),

  addKeyframe: (kf) =>
    set((s) => ({ project: { ...s.project, keyframes: [...s.project.keyframes, kf] } })),

  removeKeyframe: (id) =>
    set((s) => ({
      project: { ...s.project, keyframes: s.project.keyframes.filter((k) => k.id !== id) },
    })),

  addScene: (scene) =>
    set((s) => ({ project: { ...s.project, scenes: [...s.project.scenes, scene] } })),

  exportProject: () => JSON.stringify(get().project, null, 2),

  importProject: (json) => {
    try {
      const data = JSON.parse(json);
      set({ project: data, selectedIds: [], currentTime: 0 });
    } catch (e) {
      console.error('Invalid project JSON', e);
    }
  },

  // Recording: captures start positions of all units, records keyframes on drag
  startRecording: () => {
    const { project, currentTime } = get();
    const units = project.objects.filter((o) => o.type === 'unit');
    const startPositions: Record<string, { x: number; y: number }> = {};
    
    // Save starting positions and create start keyframes for all units
    const newKeyframes: Keyframe[] = [];
    units.forEach((u) => {
      startPositions[u.id] = { x: u.x, y: u.y };
      newKeyframes.push({
        id: uuid(),
        objectId: u.id,
        time: currentTime,
        x: u.x,
        y: u.y,
        rotation: u.rotation,
        scaleX: u.scaleX,
        scaleY: u.scaleY,
      });
    });

    set({
      isRecording: true,
      recordingStartTime: performance.now(),
      recordingStartPositions: startPositions,
      project: {
        ...get().project,
        keyframes: [...get().project.keyframes, ...newKeyframes],
      },
    });
  },

  stopRecording: () => {
    const { project, currentTime, recordingStartTime } = get();
    const elapsed = performance.now() - recordingStartTime;
    const endTime = currentTime + elapsed;
    const units = project.objects.filter((o) => o.type === 'unit');

    // Create end keyframes for all units at their current positions
    const endKeyframes: Keyframe[] = units.map((u) => ({
      id: uuid(),
      objectId: u.id,
      time: endTime,
      x: u.x,
      y: u.y,
      rotation: u.rotation,
      scaleX: u.scaleX,
      scaleY: u.scaleY,
    }));

    set({
      isRecording: false,
      recordingStartTime: 0,
      recordingStartPositions: {},
      project: {
        ...get().project,
        keyframes: [...get().project.keyframes, ...endKeyframes],
      },
    });
  },

  recordPosition: (id, x, y) => {
    // During recording, we just update the object position (keyframes created on stop)
    const state = get();
    if (!state.isRecording) return;
    set({
      project: {
        ...state.project,
        objects: state.project.objects.map((o) =>
          o.id === id ? { ...o, x, y } : o
        ),
      },
    });
  },
}));
