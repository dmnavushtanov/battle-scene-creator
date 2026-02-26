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
}));
