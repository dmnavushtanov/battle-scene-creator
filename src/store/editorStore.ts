import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import type { MapObject, Scene, Keyframe, ProjectData, DrawToolType, LayerType, ObjectSnapshot, UnitEffect, NarrationEvent, OverlayEvent, ActiveEffect, UnitGroup, SoundEvent } from '@/domain/models';
import { evaluateObjectAtTime, upsertKeyframe, evaluateEffectsAtTime } from '@/domain/services/timeline';
import { createRecordingSession, captureInitialSnapshot, finalizeRecording, type RecordingSession } from '@/domain/services/recording';
import { exportProject as serializeProject, importProject as deserializeProject } from '@/domain/services/serialization';
import { GROUP_COLORS } from '@/domain/constants';
import { createLogger } from '@/utils/logger';

const logger = createLogger('EditorStore');

function createDefaultScene(): Scene {
  const scene: Scene = {
    id: uuid(),
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
  logger.info('Created default scene', { id: scene.id });
  return scene;
}

function createDefaultProject(): ProjectData {
  const project: ProjectData = {
    version: '1.0',
    name: 'Untitled Battle',
    canvasWidth: 1920,
    canvasHeight: 1080,
    scenes: [createDefaultScene()],
  };
  logger.info('Created default project');
  return project;
}

export interface CustomIcon {
  id: string;
  label: string;
  dataUrl: string;
}

export interface MapLibraryItem {
  id: string;
  label: string;
  dataUrl: string;
}

export interface CustomEffectAsset {
  id: string;
  label: string;
  dataUrl: string;
  mimeType: string;
  mediaType: 'image' | 'video';
}

export interface ClipboardData {
  type: 'unit' | 'effect';
  object?: MapObject;
  keyframes?: Keyframe[];
  effects?: UnitEffect[];
  effect?: UnitEffect;
}

export interface EditorState {
  project: ProjectData;
  activeSceneId: string;
  selectedIds: string[];
  activeTool: DrawToolType;
  activeLayer: LayerType;
  currentTime: number;
  isPlaying: boolean;
  isVideoExporting: boolean;
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
  customEffects: CustomEffectAsset[];
  mapLibrary: MapLibraryItem[];
  selectedNarrationId: string | null;
  selectedOverlayId: string | null;
  selectedKeyframeIndex: { objectId: string; index: number } | null;
  selectedEffectId: { objectId: string; effectId: string } | null;
  clipboard: ClipboardData | null;

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
  setIsVideoExporting: (exporting: boolean) => void;
  seekTo: (time: number) => void;

  // Background
  setBackgroundImage: (url: string) => void;

  // Keyframes
  addKeyframeAtTime: (objectId: string, time: number) => void;
  batchAddKeyframes: (objectId: string, keyframes: Keyframe[]) => void;
  replaceKeyframesFromTime: (objectId: string, fromTime: number, newKeyframes: Keyframe[]) => void;
  clearKeyframes: (objectId: string) => void;
  clearAllKeyframes: () => void;
  removeKeyframe: (objectId: string, index: number) => void;
  updateKeyframe: (objectId: string, index: number, updates: Partial<Keyframe>) => void;
  setSelectedKeyframeIndex: (sel: { objectId: string; index: number } | null) => void;
  setSelectedEffectId: (sel: { objectId: string; effectId: string } | null) => void;

  // Effects
  addEffect: (objectId: string, effect: UnitEffect) => void;
  removeEffect: (objectId: string, effectId: string) => void;
  clearEffects: (objectId: string) => void;
  updateEffect: (objectId: string, effectId: string, updates: Partial<UnitEffect>) => void;

  // Narration
  addNarration: (event: NarrationEvent) => void;
  updateNarration: (id: string, updates: Partial<NarrationEvent>) => void;
  removeNarration: (id: string) => void;
  setSelectedNarrationId: (id: string | null) => void;

  // Overlays
  addOverlay: (event: OverlayEvent) => void;
  updateOverlay: (id: string, updates: Partial<OverlayEvent>) => void;
  removeOverlay: (id: string) => void;
  setSelectedOverlayId: (id: string | null) => void;

  // Sounds
  addSound: (event: SoundEvent) => void;
  updateSound: (id: string, updates: Partial<SoundEvent>) => void;
  removeSound: (id: string) => void;

  // Groups
  createGroup: (name: string, memberIds: string[]) => void;
  renameGroup: (groupId: string, name: string) => void;
  deleteGroup: (groupId: string) => void;
  addToGroup: (groupId: string, objectIds: string[]) => void;
  removeFromGroup: (groupId: string, objectIds: string[]) => void;
  getGroupForObject: (objectId: string) => UnitGroup | null;
  selectGroup: (groupId: string) => void;

  // Recording
  setRecordDurationSeconds: (dur: number) => void;
  startRecording: () => void;
  stopRecording: () => void;
  onObjectDragStart: (id: string) => void;
  onObjectDragMove: (id: string, x: number, y: number) => void;
  onObjectDragEnd: (id: string, x: number, y: number) => void;
  onGroupDragMove: (leadId: string, dx: number, dy: number, memberIds?: string[]) => void;

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

  // Map library
  addMapToLibrary: (item: MapLibraryItem) => void;
  removeMapFromLibrary: (id: string) => void;

  // Custom effects
  addCustomEffect: (effect: CustomEffectAsset) => void;
  removeCustomEffect: (id: string) => void;

  // Clipboard
  copySelected: () => void;
  pasteClipboard: () => void;

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
    isVideoExporting: false,
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
    customEffects: [],
    mapLibrary: [],
    selectedNarrationId: null,
    selectedOverlayId: null,
    selectedKeyframeIndex: null,
    selectedEffectId: null,
    clipboard: null,

    getActiveScene: () => {
      const { project, activeSceneId } = get();
      const scene = project.scenes.find((s) => s.id === activeSceneId);
      if (!scene) {
        logger.warn('Active scene not found, falling back to first scene', { activeSceneId });
        return project.scenes[0];
      }
      return scene;
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
      logger.info('Adding object', { id: obj.id, type: obj.type, label: obj.label });
      get()._updateActiveScene((scene) => ({
        ...scene,
        objectsById: { ...scene.objectsById, [obj.id]: obj },
        objectOrder: [...scene.objectOrder, obj.id],
      }));
    },

    removeObject: (id) => {
      logger.info('Removing object', { id });
      get()._updateActiveScene((scene) => {
        const { [id]: _, ...rest } = scene.objectsById;
        const { [id]: __, ...kfRest } = scene.keyframesByObjectId;
        const { [id]: ___, ...efRest } = scene.effectsByObjectId;
        const updatedGroups = { ...scene.groups };
        for (const [gid, group] of Object.entries(updatedGroups)) {
          if (group.memberIds.includes(id)) {
            updatedGroups[gid] = { ...group, memberIds: group.memberIds.filter((m) => m !== id) };
            if (updatedGroups[gid].memberIds.length === 0) {
              logger.debug('Deleting empty group after object removal', { groupId: gid });
              delete updatedGroups[gid];
            }
          }
        }
        return {
          ...scene,
          objectsById: rest,
          objectOrder: scene.objectOrder.filter((oid) => oid !== id),
          keyframesByObjectId: kfRest,
          effectsByObjectId: efRest,
          groups: updatedGroups,
        };
      });
      set((s) => ({ selectedIds: s.selectedIds.filter((sid) => sid !== id) }));
    },

    updateObject: (id, updates) => {
      logger.debug('Updating object', { id, updates });
      get()._updateActiveScene((scene) => {
        const existing = scene.objectsById[id];
        if (!existing) {
          logger.warn('Tried to update non-existent object', { id });
          return scene;
        }
        return {
          ...scene,
          objectsById: { ...scene.objectsById, [id]: { ...existing, ...updates } },
        };
      });
    },

    setSelectedIds: (ids) => {
      logger.debug('Setting selection', { ids });
      set({ selectedIds: ids, selectedNarrationId: null, selectedOverlayId: null });
    },
    setActiveTool: (tool) => {
      logger.info('Tool changed', { tool });
      set({ activeTool: tool });
    },
    setActiveLayer: (layer) => {
      logger.info('Layer changed', { layer });
      set({ activeLayer: layer });
    },

    setCurrentTime: (time) => set({ currentTime: time }),
    setIsPlaying: (playing) => {
      logger.info('Playback toggled', { playing, atTime: get().currentTime });
      set({ isPlaying: playing });
    },
    setIsVideoExporting: (exporting) => {
      logger.info('Video export toggled', { exporting });
      set({ isVideoExporting: exporting });
    },

    seekTo: (time) => {
      logger.debug('Seek to', { time });
      set({ currentTime: time });
      get().computeDerivedTransforms(time);
    },

    setBackgroundImage: (url) => {
      logger.info('Set background image');
      get()._updateActiveScene((scene) => ({ ...scene, backgroundImage: url }));
    },

    addKeyframeAtTime: (objectId, time) => {
      logger.debug('Adding keyframe', { objectId, time });
      const scene = get().getActiveScene();
      const obj = scene.objectsById[objectId];
      if (!obj) {
        logger.error('Failed to add keyframe: object not found', { objectId });
        return;
      }
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

    batchAddKeyframes: (objectId, keyframes) => {
      logger.debug('Batch adding keyframes', { objectId, count: keyframes.length });
      get()._updateActiveScene((s) => {
        let existing = s.keyframesByObjectId[objectId] || [];
        for (const kf of keyframes) {
          existing = upsertKeyframe(existing, kf);
        }
        return {
          ...s,
          keyframesByObjectId: { ...s.keyframesByObjectId, [objectId]: existing },
        };
      });
    },

    replaceKeyframesFromTime: (objectId, fromTime, newKeyframes) => {
      logger.info('Replacing keyframes from time', { objectId, fromTime, count: newKeyframes.length });
      get()._updateActiveScene((s) => {
        const existing = s.keyframesByObjectId[objectId] || [];
        const preserved = existing.filter((kf) => kf.time < fromTime);
        const replaced = [...preserved, ...newKeyframes].sort((a, b) => a.time - b.time);
        return {
          ...s,
          keyframesByObjectId: { ...s.keyframesByObjectId, [objectId]: replaced },
        };
      });
    },

    clearKeyframes: (objectId) => {
      logger.info('Clearing keyframes for object', { objectId });
      get()._updateActiveScene((s) => {
        const { [objectId]: _, ...rest } = s.keyframesByObjectId;
        return { ...s, keyframesByObjectId: rest };
      });
    },

    clearAllKeyframes: () => {
      logger.info('Clearing all keyframes');
      get()._updateActiveScene((s) => ({ ...s, keyframesByObjectId: {} }));
    },

    removeKeyframe: (objectId, index) => {
      logger.info('Removing keyframe', { objectId, index });
      get()._updateActiveScene((s) => {
        const kfs = s.keyframesByObjectId[objectId] || [];
        const updated = kfs.filter((_, i) => i !== index);
        if (updated.length === 0) {
          const { [objectId]: _, ...rest } = s.keyframesByObjectId;
          return { ...s, keyframesByObjectId: rest };
        }
        return { ...s, keyframesByObjectId: { ...s.keyframesByObjectId, [objectId]: updated } };
      });
      set({ selectedKeyframeIndex: null });
    },

    updateKeyframe: (objectId, index, updates) => {
      logger.debug('Updating keyframe', { objectId, index, updates });
      get()._updateActiveScene((s) => {
        const kfs = [...(s.keyframesByObjectId[objectId] || [])];
        if (index < 0 || index >= kfs.length) return s;
        kfs[index] = { ...kfs[index], ...updates };
        kfs.sort((a, b) => a.time - b.time);
        return { ...s, keyframesByObjectId: { ...s.keyframesByObjectId, [objectId]: kfs } };
      });
    },

    setSelectedKeyframeIndex: (sel) => set({ selectedKeyframeIndex: sel }),
    setSelectedEffectId: (sel) => set({ selectedEffectId: sel }),

    // Effects CRUD
    addEffect: (objectId, effect) => {
      logger.info('Adding effect', { objectId, effectType: effect.type });
      get()._updateActiveScene((s) => ({
        ...s,
        effectsByObjectId: {
          ...s.effectsByObjectId,
          [objectId]: [...(s.effectsByObjectId[objectId] || []), effect],
        },
      }));
    },

    removeEffect: (objectId, effectId) => {
      logger.info('Removing effect', { objectId, effectId });
      get()._updateActiveScene((s) => ({
        ...s,
        effectsByObjectId: {
          ...s.effectsByObjectId,
          [objectId]: (s.effectsByObjectId[objectId] || []).filter((e) => e.id !== effectId),
        },
      }));
    },

    clearEffects: (objectId) => {
      logger.info('Clearing effects for object', { objectId });
      get()._updateActiveScene((s) => {
        const { [objectId]: _, ...rest } = s.effectsByObjectId;
        return { ...s, effectsByObjectId: rest };
      });
    },

    updateEffect: (objectId, effectId, updates) => {
      logger.debug('Updating effect', { objectId, effectId, updates });
      get()._updateActiveScene((s) => ({
        ...s,
        effectsByObjectId: {
          ...s.effectsByObjectId,
          [objectId]: (s.effectsByObjectId[objectId] || []).map((e) =>
            e.id === effectId ? { ...e, ...updates } : e
          ),
        },
      }));
    },

    // Narration CRUD
    addNarration: (event) => {
      logger.info('Adding narration', { id: event.id });
      get()._updateActiveScene((s) => ({
        ...s,
        narrationEvents: [...s.narrationEvents, event],
      }));
      set({ selectedNarrationId: event.id, selectedIds: [], selectedOverlayId: null });
    },

    updateNarration: (id, updates) => {
      logger.debug('Updating narration', { id, updates });
      get()._updateActiveScene((s) => ({
        ...s,
        narrationEvents: s.narrationEvents.map((n) =>
          n.id === id ? { ...n, ...updates } : n
        ),
      }));
    },

    removeNarration: (id) => {
      logger.info('Removing narration', { id });
      get()._updateActiveScene((s) => ({
        ...s,
        narrationEvents: s.narrationEvents.filter((n) => n.id !== id),
      }));
      set((s) => s.selectedNarrationId === id ? { selectedNarrationId: null } : {});
    },

    setSelectedNarrationId: (id) => set({ selectedNarrationId: id, selectedOverlayId: null, selectedIds: [] }),

    // Overlay CRUD
    addOverlay: (event) => {
      logger.info('Adding overlay', { id: event.id });
      get()._updateActiveScene((s) => ({
        ...s,
        overlayEvents: [...s.overlayEvents, event],
      }));
      set({ selectedOverlayId: event.id, selectedIds: [], selectedNarrationId: null });
    },

    updateOverlay: (id, updates) => {
      logger.debug('Updating overlay', { id, updates });
      get()._updateActiveScene((s) => ({
        ...s,
        overlayEvents: s.overlayEvents.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      }));
    },

    removeOverlay: (id) => {
      logger.info('Removing overlay', { id });
      get()._updateActiveScene((s) => ({
        ...s,
        overlayEvents: s.overlayEvents.filter((o) => o.id !== id),
      }));
      set((s) => s.selectedOverlayId === id ? { selectedOverlayId: null } : {});
    },

    setSelectedOverlayId: (id) => set({ selectedOverlayId: id, selectedNarrationId: null, selectedIds: [] }),

    // Sounds CRUD
    addSound: (event) => {
      logger.info('Adding sound', { id: event.id });
      get()._updateActiveScene((s) => ({
        ...s,
        soundEvents: [...(s.soundEvents || []), event],
      }));
    },

    updateSound: (id, updates) => {
      logger.debug('Updating sound', { id, updates });
      get()._updateActiveScene((s) => ({
        ...s,
        soundEvents: (s.soundEvents || []).map((snd) =>
          snd.id === id ? { ...snd, ...updates } : snd
        ),
      }));
    },

    removeSound: (id) => {
      logger.info('Removing sound', { id });
      get()._updateActiveScene((s) => ({
        ...s,
        soundEvents: (s.soundEvents || []).filter((snd) => snd.id !== id),
      }));
    },

    // Groups
    createGroup: (name, memberIds) => {
      logger.info('Creating group', { name, memberCount: memberIds.length });
      const scene = get().getActiveScene();
      const groupCount = Object.keys(scene.groups).length;
      const color = GROUP_COLORS[groupCount % GROUP_COLORS.length];
      const uniqueMembers = Array.from(new Set(memberIds));
      const group: UnitGroup = { id: uuid(), name, color, memberIds: uniqueMembers };
      get()._updateActiveScene((s) => ({
        ...s,
        groups: (() => {
          const updatedGroups: Record<string, UnitGroup> = {};
          for (const [gid, existing] of Object.entries(s.groups)) {
            const filteredMembers = existing.memberIds.filter((m) => !uniqueMembers.includes(m));
            if (filteredMembers.length > 0) {
              updatedGroups[gid] = { ...existing, memberIds: filteredMembers };
            }
          }
          updatedGroups[group.id] = group;
          return updatedGroups;
        })(),
      }));
    },

    renameGroup: (groupId, name) => {
      logger.debug('Renaming group', { groupId, name });
      get()._updateActiveScene((s) => ({
        ...s,
        groups: {
          ...s.groups,
          [groupId]: { ...s.groups[groupId], name },
        },
      }));
    },

    deleteGroup: (groupId) => {
      logger.info('Deleting group', { groupId });
      get()._updateActiveScene((s) => {
        const { [groupId]: _, ...rest } = s.groups;
        return { ...s, groups: rest };
      });
    },

    addToGroup: (groupId, objectIds) => {
      logger.info('Adding to group', { groupId, objectCount: objectIds.length });
      get()._updateActiveScene((s) => {
        const group = s.groups[groupId];
        if (!group) {
          logger.error('Failed to add to group: group not found', { groupId });
          return s;
        }
        const incoming = Array.from(new Set(objectIds));
        const updatedGroups: Record<string, UnitGroup> = {};

        for (const [gid, existing] of Object.entries(s.groups)) {
          if (gid === groupId) continue;
          const filteredMembers = existing.memberIds.filter((m) => !incoming.includes(m));
          if (filteredMembers.length > 0) {
            updatedGroups[gid] = { ...existing, memberIds: filteredMembers };
          }
        }

        const newMembers = Array.from(new Set([...group.memberIds, ...incoming]));
        updatedGroups[groupId] = { ...group, memberIds: newMembers };

        return {
          ...s,
          groups: updatedGroups,
        };
      });
    },

    removeFromGroup: (groupId, objectIds) => {
      logger.info('Removing from group', { groupId, objectCount: objectIds.length });
      get()._updateActiveScene((s) => {
        const group = s.groups[groupId];
        if (!group) return s;
        const newMembers = group.memberIds.filter((m) => !objectIds.includes(m));
        if (newMembers.length === 0) {
          const { [groupId]: _, ...rest } = s.groups;
          return { ...s, groups: rest };
        }
        return {
          ...s,
          groups: { ...s.groups, [groupId]: { ...group, memberIds: newMembers } },
        };
      });
    },

    getGroupForObject: (objectId) => {
      const scene = get().getActiveScene();
      for (const group of Object.values(scene.groups)) {
        if (group.memberIds.includes(objectId)) return group;
      }
      return null;
    },

    selectGroup: (groupId) => {
      logger.info('Selecting group', { groupId });
      const scene = get().getActiveScene();
      const group = scene.groups[groupId];
      if (group) set({ selectedIds: [...group.memberIds], selectedNarrationId: null, selectedOverlayId: null });
    },

    setRecordDurationSeconds: (dur) => {
      logger.debug('Setting recording duration', { seconds: dur });
      set({ recordDurationSeconds: dur });
    },

    startRecording: () => {
      if (get().isRecording) {
        logger.warn('Tried to start recording while already recording');
        return;
      }
      const { currentTime, recordDurationSeconds, derivedTransforms } = get();
      const durationMs = recordDurationSeconds * 1000;
      const endTime = currentTime + durationMs;

      logger.info('Starting recording session', { startTime: currentTime, durationMs });

      const scene = get().getActiveScene();
      if (endTime > scene.duration) {
        logger.debug('Extending scene duration for recording', { oldDuration: scene.duration, newDuration: endTime });
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
        logger.warn('Tried to stop recording but no session found');
        set({ isRecording: false, recordingSession: null });
        return;
      }
      logger.info('Stopping recording session', { startTime: recordingSession.startTime });
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
      logger.debug('Recording drag start', { id });
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
      set((s) => {
        const prevDerived = s.derivedTransforms[id];
        return {
          derivedTransforms: {
            ...s.derivedTransforms,
            [id]: {
              x,
              y,
              rotation: prevDerived?.rotation ?? obj.rotation,
              scaleX: prevDerived?.scaleX ?? obj.scaleX,
              scaleY: prevDerived?.scaleY ?? obj.scaleY,
              visible: prevDerived?.visible ?? obj.visible,
            },
          },
        };
      });
    },

    onObjectDragEnd: (id, x, y) => {
      get().onObjectDragMove(id, x, y);
    },

    onGroupDragMove: (leadId, dx, dy, memberIds) => {
      const { selectedIds, isRecording, recordingSession, derivedTransforms } = get();
      const activeSelection = memberIds && memberIds.length > 1 ? memberIds : selectedIds;
      const uniqueSelectedIds = Array.from(new Set(activeSelection));
      if (!uniqueSelectedIds.includes(leadId) || uniqueSelectedIds.length <= 1) return;
      const scene = get().getActiveScene();
      const updates: Record<string, MapObject> = {};
      for (const sid of uniqueSelectedIds) {
        if (sid === leadId) continue;
        const obj = scene.objectsById[sid];
        if (!obj || obj.locked) continue;
        const derived = derivedTransforms[sid];
        const baseX = derived ? derived.x : obj.x;
        const baseY = derived ? derived.y : obj.y;
        if (isRecording && recordingSession) {
          captureInitialSnapshot(recordingSession, obj);
        }
        updates[sid] = { ...obj, x: baseX + dx, y: baseY + dy };
      }
      if (Object.keys(updates).length > 0) {
        get()._updateActiveScene((s) => ({
          ...s,
          objectsById: { ...s.objectsById, ...updates },
        }));
        set((s) => {
          const nextDerived = { ...s.derivedTransforms };
          for (const updated of Object.values(updates)) {
            const prev = nextDerived[updated.id];
            nextDerived[updated.id] = {
              x: updated.x,
              y: updated.y,
              rotation: prev?.rotation ?? updated.rotation,
              scaleX: prev?.scaleX ?? updated.scaleX,
              scaleY: prev?.scaleY ?? updated.scaleY,
              visible: prev?.visible ?? updated.visible,
            };
          }
          return { derivedTransforms: nextDerived };
        });
      }
    },

    setStageScale: (scale) => set({ stageScale: scale }),
    setStagePosition: (pos) => set({ stagePosition: pos }),

    setActiveSceneId: (id) => {
      logger.info('Switching scene', { id });
      set({ activeSceneId: id });
    },
    setSceneDuration: (ms) => {
      logger.info('Setting scene duration', { ms });
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

      const activeNarrations = (scene.narrationEvents || []).filter(
        (n) => time >= n.startTime && time <= n.startTime + n.duration
      );

      const activeOverlay = (scene.overlayEvents || []).find(
        (o) => time >= o.startTime && time <= o.startTime + o.duration
      ) || null;

      set({ derivedTransforms: transforms, derivedEffects: effects, activeNarrations, activeOverlay });
    },

    addCustomIcon: (icon) => {
      logger.info('Adding custom icon', { id: icon.id, label: icon.label });
      set((s) => ({ customIcons: [...s.customIcons, icon] }));
    },
    removeCustomIcon: (id) => {
      logger.info('Removing custom icon', { id });
      set((s) => ({ customIcons: s.customIcons.filter((i) => i.id !== id) }));
    },

    addMapToLibrary: (item) => set((s) => ({ mapLibrary: [...s.mapLibrary, item] })),
    removeMapFromLibrary: (id) => set((s) => ({ mapLibrary: s.mapLibrary.filter((i) => i.id !== id) })),

    addCustomEffect: (effect) => {
      logger.info('Adding custom effect', { id: effect.id, label: effect.label });
      set((s) => ({ customEffects: [...s.customEffects, effect] }));
    },
    removeCustomEffect: (id) => {
      logger.info('Removing custom effect', { id });
      set((s) => ({ customEffects: s.customEffects.filter((i) => i.id !== id) }));
    },

    // Clipboard
    copySelected: () => {
      const { selectedIds, selectedEffectId } = get();
      const scene = get().getActiveScene();

      // Copy effect
      if (selectedEffectId) {
        const effs = scene.effectsByObjectId[selectedEffectId.objectId] || [];
        const eff = effs.find((e) => e.id === selectedEffectId.effectId);
        if (eff) {
          logger.info('Copied effect to clipboard', { effectId: eff.id });
          set({ clipboard: { type: 'effect', effect: { ...eff } } });
        }
        return;
      }

      // Copy unit
      if (selectedIds.length === 1) {
        const obj = scene.objectsById[selectedIds[0]];
        if (!obj) return;
        logger.info('Copied unit to clipboard', { objectId: obj.id });
        const kfs = scene.keyframesByObjectId[obj.id] || [];
        const effs = scene.effectsByObjectId[obj.id] || [];
        set({
          clipboard: {
            type: 'unit',
            object: { ...obj },
            keyframes: kfs.map((k) => ({ ...k })),
            effects: effs.map((e) => ({ ...e })),
          },
        });
      }
    },

    pasteClipboard: () => {
      const { clipboard, selectedIds, currentTime } = get();
      if (!clipboard) {
        logger.warn('Tried to paste but clipboard is empty');
        return;
      }
      const scene = get().getActiveScene();

      if (clipboard.type === 'unit' && clipboard.object) {
        const newId = uuid();
        logger.info('Pasting unit from clipboard', { originalId: clipboard.object.id, newId });
        const newObj: MapObject = {
          ...clipboard.object,
          id: newId,
          x: clipboard.object.x + 30,
          y: clipboard.object.y + 30,
        };
        get().addObject(newObj);

        // Copy keyframes
        if (clipboard.keyframes && clipboard.keyframes.length > 0) {
          get().batchAddKeyframes(newId, clipboard.keyframes.map((k) => ({ ...k })));
        }

        // Copy effects
        if (clipboard.effects) {
          for (const eff of clipboard.effects) {
            get().addEffect(newId, { ...eff, id: uuid() });
          }
        }

        set({ selectedIds: [newId] });
      }

      if (clipboard.type === 'effect' && clipboard.effect) {
        // Paste effect onto selected unit
        const targetId = selectedIds[0];
        if (!targetId) {
          logger.warn('Tried to paste effect but no unit selected');
          return;
        }
        const obj = scene.objectsById[targetId];
        if (!obj) return;
        logger.info('Pasting effect onto unit', { targetId, effectType: clipboard.effect.type });
        get().addEffect(targetId, { ...clipboard.effect, id: uuid(), startTime: currentTime });
      }
    },

    exportProject: () => {
      logger.info('Exporting project JSON');
      return serializeProject(get().project);
    },

    importProject: (json) => {
      logger.info('Importing project JSON');
      try {
        const data = deserializeProject(json);
        data.scenes = data.scenes.map((s) => ({ ...s, groups: s.groups || {}, soundEvents: s.soundEvents || [] }));
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
          selectedNarrationId: null,
          selectedOverlayId: null,
          selectedKeyframeIndex: null,
        });
        logger.info('Import successful', { sceneCount: data.scenes.length });
      } catch (e) {
        logger.error('Failed to import project', e);
      }
    },
  };
});
