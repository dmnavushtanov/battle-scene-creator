import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Image as KImage, Group, Text, Circle, Line, Arrow } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '@/store/editorStore';
import type { MapObject, UnitType } from '@/domain/models';
import type { CustomEffectAsset } from '@/store/editorStore';
import { EFFECT_PRESETS, createEffectFromPreset, getShakeOffset } from '@/domain/services/effects';
import { EFFECT_COLORS, EFFECT_VISUAL_SYMBOLS, UNIT_LABELS, UNIT_COLOR, UNIT_CATEGORY } from '@/domain/constants';
import { CrackEffect, BloodEffect, ExplosionEffect, SmokeEffect, FireEffect, GunshotEffect } from './effects';
import { UNIT_TYPES, UNIT_CATEGORIES } from './UnitIcon';
import { UNIT_ICON_URLS } from '@/assets/icons';
import { v4 as uuid } from 'uuid';
import { Route } from 'lucide-react';
import { evaluateObjectAtTime } from '@/domain/services/timeline';

// --- Image cache for custom icons AND built-in unit icons ---
const imageCache = new Map<string, HTMLImageElement>();

function useImageCache(sources: string[]) {
  const [, forceRerender] = useState(0);
  useEffect(() => {
    let cancelled = false;
    sources.forEach((src) => {
      if (!src || imageCache.has(src)) return;
      const image = new window.Image();
      image.src = src;
      image.onload = () => {
        imageCache.set(src, image);
        if (!cancelled) forceRerender((v) => v + 1);
      };
    });
    return () => { cancelled = true; };
  }, [sources]);
  return imageCache;
}


const videoCache = new Map<string, HTMLVideoElement>();

function useVideoCache(sources: string[]) {
  const [, forceRerender] = useState(0);
  useEffect(() => {
    let cancelled = false;

    sources.forEach((src) => {
      if (!src || videoCache.has(src)) return;

      const video = document.createElement('video');
      video.src = src;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.oncanplay = () => {
        videoCache.set(src, video);
        if (!cancelled) forceRerender((v) => v + 1);
      };
    });

    return () => { cancelled = true; };
  }, [sources]);

  return videoCache;
}

function isVideoDataUrl(url: string | undefined): boolean {
  return Boolean(url && url.startsWith('data:video/'));
}

const MapCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const lastDragPos = useRef<{ x: number; y: number } | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number; stageX: number; stageY: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objectId: string | null } | null>(null);
  const isDrawingArrow = useRef(false);
  const [drawingArrow, setDrawingArrow] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[]>([]);
  const isDrawingPath = useRef(false);
  const [selectionRect, setSelectionRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const isMarqueeSelecting = useRef(false);

  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const activeTool = useEditorStore((s) => s.activeTool);
  const stageScale = useEditorStore((s) => s.stageScale);
  const stagePosition = useEditorStore((s) => s.stagePosition);
  const isRecording = useEditorStore((s) => s.isRecording);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const derivedTransforms = useEditorStore((s) => s.derivedTransforms);
  const derivedEffects = useEditorStore((s) => s.derivedEffects);
  const currentTime = useEditorStore((s) => s.currentTime);
  const customEffects = useEditorStore((s) => s.customEffects);

  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const updateObject = useEditorStore((s) => s.updateObject);
  const onObjectDragStart = useEditorStore((s) => s.onObjectDragStart);
  const onObjectDragMove = useEditorStore((s) => s.onObjectDragMove);
  const onObjectDragEnd = useEditorStore((s) => s.onObjectDragEnd);
  const onGroupDragMove = useEditorStore((s) => s.onGroupDragMove);
  const setStageScale = useEditorStore((s) => s.setStageScale);
  const setStagePosition = useEditorStore((s) => s.setStagePosition);
  const addObject = useEditorStore((s) => s.addObject);
  const addEffect = useEditorStore((s) => s.addEffect);
  const addToGroup = useEditorStore((s) => s.addToGroup);
  const replaceKeyframesFromTime = useEditorStore((s) => s.replaceKeyframesFromTime);
  const recordDurationSeconds = useEditorStore((s) => s.recordDurationSeconds);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const copySelected = useEditorStore((s) => s.copySelected);
  const pasteClipboard = useEditorStore((s) => s.pasteClipboard);

  const objectsById = activeScene.objectsById;
  const objectOrder = activeScene.objectOrder;
  const backgroundImage = activeScene.backgroundImage;
  const groups = activeScene.groups || {};

  useEffect(() => { (window as any).__konvaStageRef = stageRef; }, []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) setDims({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!backgroundImage) { setBgImage(null); return; }
    const img = new window.Image();
    img.src = backgroundImage;
    img.onload = () => setBgImage(img);
  }, [backgroundImage]);

  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  // Global keyboard handler: Escape, Ctrl+C, Ctrl+V
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copySelected();
        return;
      }
      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteClipboard();
        return;
      }

      // Delete / Backspace — delete selected objects immediately
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't intercept if user is typing in an input/textarea
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        const sids = useEditorStore.getState().selectedIds;
        if (sids.length > 0) {
          e.preventDefault();
          const removeObject = useEditorStore.getState().removeObject;
          sids.forEach((id) => removeObject(id));
          useEditorStore.setState({ selectedIds: [] });
        }
        return;
      }

      // Space — toggle play/pause
      if (e.key === ' ') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
        e.preventDefault();
        const { isPlaying, setIsPlaying } = useEditorStore.getState();
        setIsPlaying(!isPlaying);
        return;
      }

      if (e.key !== 'Escape') return;

      // If drawing a path, cancel it
      if (isDrawingPath.current || pathPoints.length > 0) {
        setPathPoints([]);
        isDrawingPath.current = false;
        setActiveTool('select');
        return;
      }

      // Otherwise deselect everything
      useEditorStore.setState({ selectedIds: [], selectedNarrationId: null, selectedOverlayId: null, selectedKeyframeIndex: null });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathPoints.length, setActiveTool, copySelected, pasteClipboard]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const oldScale = stageScale;
      const pointer = stage.getPointerPosition()!;
      const scaleBy = 1.08;
      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));
      const mousePointTo = {
        x: (pointer.x - stagePosition.x) / oldScale,
        y: (pointer.y - stagePosition.y) / oldScale,
      };
      setStageScale(clampedScale);
      setStagePosition({ x: pointer.x - mousePointTo.x * clampedScale, y: pointer.y - mousePointTo.y * clampedScale });
    },
    [stageScale, stagePosition, setStageScale, setStagePosition]
  );

  const getStageCoords = (pointer: { x: number; y: number }) => ({
    x: (pointer.x - stagePosition.x) / stageScale,
    y: (pointer.y - stagePosition.y) / stageScale,
  });

  /** Save the current path as keyframes for the selected unit */
  const finalizePath = () => {
    if (pathPoints.length < 2) {
      setPathPoints([]);
      isDrawingPath.current = false;
      setActiveTool('select');
      return;
    }

    const sids = useEditorStore.getState().selectedIds;
    if (sids.length !== 1) {
      setPathPoints([]);
      isDrawingPath.current = false;
      setActiveTool('select');
      return;
    }

    const unitId = sids[0];
    const ct = useEditorStore.getState().currentTime;
    const durMs = recordDurationSeconds * 1000;
    const obj = activeScene.objectsById[unitId];
    if (!obj) {
      setPathPoints([]);
      isDrawingPath.current = false;
      setActiveTool('select');
      return;
    }

    const unitStartTime = obj?.startTime ?? 0;
    const pathStartTime = Math.max(ct, unitStartTime);
    const existingKeyframes = activeScene.keyframesByObjectId[unitId] || [];
    const evaluatedStart = evaluateObjectAtTime(obj, existingKeyframes, pathStartTime);
    const waypoints = [{ x: evaluatedStart.x, y: evaluatedStart.y }, ...pathPoints];

    const keyframes = waypoints.map((pt, i) => ({
      time: pathStartTime + (i / (waypoints.length - 1)) * durMs,
      x: pt.x,
      y: pt.y,
      rotation: evaluatedStart.rotation,
      scaleX: evaluatedStart.scaleX,
      scaleY: evaluatedStart.scaleY,
      visible: evaluatedStart.visible,
    }));
    replaceKeyframesFromTime(unitId, pathStartTime, keyframes);

    const endTime = pathStartTime + durMs;
    if (endTime > activeScene.duration) {
      useEditorStore.getState().setSceneDuration(Math.ceil(endTime / 1000) * 1000);
    }

    setPathPoints([]);
    isDrawingPath.current = false;
    setActiveTool('select');
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1) {
      e.evt.preventDefault();
      isPanning.current = true;
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition()!;
        panStart.current = { x: pointer.x, y: pointer.y, stageX: stagePosition.x, stageY: stagePosition.y };
        stage.container().style.cursor = 'grabbing';
      }
    }
    if (e.evt.button === 0 && (activeTool === 'arrow' || activeTool === 'animated_arrow')) {
      const stage = stageRef.current;
      if (!stage) return;
      const coords = getStageCoords(stage.getPointerPosition()!);
      isDrawingArrow.current = true;
      setDrawingArrow({ x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y });
    }
    // Marquee selection: start on left-click on empty canvas in select mode
    if (e.evt.button === 0 && activeTool === 'select' && !isPlaying) {
      const target = e.target;
      const stage = stageRef.current;
      if ((target === stage || target.attrs?.id === 'bg-rect') && stage) {
        const coords = getStageCoords(stage.getPointerPosition()!);
        isMarqueeSelecting.current = true;
        setSelectionRect({ x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y });
      }
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current && panStart.current) {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition()!;
      setStagePosition({ x: panStart.current.stageX + pointer.x - panStart.current.x, y: panStart.current.stageY + pointer.y - panStart.current.y });
    }
    if (isDrawingArrow.current && drawingArrow) {
      const stage = stageRef.current;
      if (!stage) return;
      const coords = getStageCoords(stage.getPointerPosition()!);
      setDrawingArrow({ ...drawingArrow, x2: coords.x, y2: coords.y });
    }
    // Marquee selection: update rect
    if (isMarqueeSelecting.current && selectionRect) {
      const stage = stageRef.current;
      if (!stage) return;
      const coords = getStageCoords(stage.getPointerPosition()!);
      setSelectionRect({ ...selectionRect, x2: coords.x, y2: coords.y });
    }
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null;
      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = 'default';
    }
    if (isDrawingArrow.current && drawingArrow) {
      isDrawingArrow.current = false;
      const dx = drawingArrow.x2 - drawingArrow.x1;
      const dy = drawingArrow.y2 - drawingArrow.y1;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        const isAnimated = activeTool === 'animated_arrow';
        const ct = useEditorStore.getState().currentTime;
        const durMs = recordDurationSeconds * 1000;
        const obj: MapObject = {
          id: uuid(), type: isAnimated ? 'animated_arrow' : 'drawing',
          drawTool: isAnimated ? undefined : 'arrow', x: 0, y: 0,
          points: [drawingArrow.x1, drawingArrow.y1, drawingArrow.x2, drawingArrow.y2],
          rotation: 0, scaleX: 1, scaleY: 1, layer: 'drawings', visible: true, locked: false,
          color: '#d4a843',
          ...(isAnimated ? { animStartTime: ct, animEndTime: ct + durMs } : {}),
        };
        addObject(obj);
        setSelectedIds([obj.id]);
      }
      setDrawingArrow(null);
    }
    // Marquee selection: finalize
    if (isMarqueeSelecting.current && selectionRect) {
      isMarqueeSelecting.current = false;
      const minX = Math.min(selectionRect.x1, selectionRect.x2);
      const maxX = Math.max(selectionRect.x1, selectionRect.x2);
      const minY = Math.min(selectionRect.y1, selectionRect.y2);
      const maxY = Math.max(selectionRect.y1, selectionRect.y2);
      // Only select if dragged at least 5px
      if (maxX - minX > 5 || maxY - minY > 5) {
        const matchingIds = objectOrder.filter((id) => {
          const obj = objectsById[id];
          if (!obj || obj.type === 'drawing') return false;
          const derived = getObjectTransform(id);
          const ox = derived ? derived.x : obj.x;
          const oy = derived ? derived.y : obj.y;
          return ox >= minX && ox <= maxX && oy >= minY && oy <= maxY;
        });
        if (matchingIds.length > 0) {
          setSelectedIds(matchingIds);
        }
      }
      setSelectionRect(null);
    }
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0 || isPanning.current) return;

    // Text tool — click to place a text label
    if (activeTool === 'text') {
      const stage = stageRef.current;
      if (!stage) return;
      const coords = getStageCoords(stage.getPointerPosition()!);
      const obj: MapObject = {
        id: uuid(), type: 'map_text', label: 'Text',
        x: coords.x, y: coords.y, rotation: 0, scaleX: 1, scaleY: 1,
        layer: 'units', visible: true, locked: false,
        text: 'City Name', fontSize: 20, fontColor: '#ffffff',
      };
      addObject(obj);
      setSelectedIds([obj.id]);
      setActiveTool('select');
      return;
    }

    // Left-click adds waypoint when in path mode
    if (activeTool === 'path') {
      const stage = stageRef.current;
      if (!stage) return;

      // Must have exactly 1 unit selected
      const sids = useEditorStore.getState().selectedIds;
      if (sids.length !== 1) return;

      const coords = getStageCoords(stage.getPointerPosition()!);
      isDrawingPath.current = true;
      setPathPoints((prev) => [...prev, coords]);
      return;
    }

    // Click on empty space deselects
    const target = e.target;
    const stage = stageRef.current;
    if (target === stage || target.attrs?.id === 'bg-rect') {
      useEditorStore.setState({ selectedIds: [], selectedNarrationId: null, selectedOverlayId: null, selectedKeyframeIndex: null });
      setContextMenu(null);
    }
  };

  // Right-click on stage: finalize path if drawing, or show add menu on empty space
  const handleStageContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    if (activeTool === 'path' && pathPoints.length >= 2) {
      finalizePath();
      return;
    }

    // Show context menu on empty space
    const target = e.target;
    const stage = stageRef.current;
    const container = containerRef.current;
    if ((target === stage || target.attrs?.id === 'bg-rect') && container) {
      const rect = container.getBoundingClientRect();
      setContextMenu({ x: e.evt.clientX - rect.left, y: e.evt.clientY - rect.top, objectId: null });
    }
  };

  const handleAddUnitAtCursor = (unitType: UnitType) => {
    if (!contextMenu) return;
    const cx = (contextMenu.x - stagePosition.x) / stageScale;
    const cy = (contextMenu.y - stagePosition.y) / stageScale;
    const category = UNIT_CATEGORY[unitType] || 'military';
    const obj: MapObject = {
      id: uuid(), type: 'unit', unitType, objectCategory: category as any,
      label: unitType, x: cx, y: cy,
      rotation: 0, scaleX: 1, scaleY: 1, layer: 'units',
      visible: true, locked: false, width: 50, height: 50,
    };
    addObject(obj);
    setActiveTool('select');
    setSelectedIds([obj.id]);
    setContextMenu(null);
  };

  const handleAddEffectAtCursor = (presetIndex: number) => {
    if (!contextMenu) return;
    const cx = (contextMenu.x - stagePosition.x) / stageScale;
    const cy = (contextMenu.y - stagePosition.y) / stageScale;
    const preset = EFFECT_PRESETS[presetIndex];
    if (!preset) return;
    const obj: MapObject = {
      id: uuid(), type: 'effect', effectType: preset.type, label: preset.label,
      x: cx, y: cy, rotation: 0, scaleX: 1, scaleY: 1,
      layer: 'effects', visible: true, locked: false, width: 60, height: 60,
    };
    addObject(obj);
    const effect = createEffectFromPreset(preset, useEditorStore.getState().currentTime);
    addEffect(obj.id, effect);
    setSelectedIds([obj.id]);
    setContextMenu(null);
  };

  const handleDragStart = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    lastDragPos.current = { x: e.target.x(), y: e.target.y() };
    onObjectDragStart(id);
  };

  const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const x = e.target.x(), y = e.target.y();
    const prev = lastDragPos.current;
    onObjectDragMove(id, x, y);
    if (prev && selectedIds.includes(id) && selectedIds.length > 1) {
      onGroupDragMove(id, x - prev.x, y - prev.y);
    }
    lastDragPos.current = { x, y };
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    onObjectDragEnd(id, e.target.x(), e.target.y());
    lastDragPos.current = null;
  };

  const getObjectTransform = (id: string) => {
    if (derivedTransforms[id]) return derivedTransforms[id];
    return null;
  };

  const resolveDroppedCustomEffect = (effectData: string): CustomEffectAsset | null => {
    if (!effectData.startsWith('custom:')) return null;
    const customEffectId = effectData.slice('custom:'.length);
    if (!customEffectId) return null;
    const effectAsset = customEffects.find((effect) => effect.id === customEffectId);
    return effectAsset || null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const stage = stageRef.current;
    const container = containerRef.current;
    if (!stage || !container) return;
    const rect = container.getBoundingClientRect();
    const stageX = (e.clientX - rect.left - stagePosition.x) / stageScale;
    const stageY = (e.clientY - rect.top - stagePosition.y) / stageScale;

    const unitData = e.dataTransfer.getData('application/unit-type');
    if (unitData) {
      const category = UNIT_CATEGORY[unitData] || 'military';
      const obj: MapObject = {
        id: uuid(), type: 'unit', unitType: unitData as any,
        objectCategory: category as any,
        label: e.dataTransfer.getData('application/unit-label') || unitData,
        customIcon: e.dataTransfer.getData('application/custom-icon') || undefined,
        x: stageX, y: stageY, rotation: 0, scaleX: 1, scaleY: 1,
        layer: 'units', visible: true, locked: false, width: 50, height: 50,
      };
      addObject(obj);
      useEditorStore.getState().setActiveTool('select');
      setSelectedIds([obj.id]);
      return;
    }

    const effectData = e.dataTransfer.getData('application/effect-preset');
    if (!effectData) return;

    const customEffect = resolveDroppedCustomEffect(effectData);
    if (customEffect) {
      const customEffectObject: MapObject = {
        id: uuid(), type: 'effect', effectType: 'smoke', label: customEffect.label,
        x: stageX, y: stageY, rotation: 0, scaleX: 1, scaleY: 1,
        customIcon: customEffect.dataUrl,
        layer: 'effects', visible: true, locked: false, width: 60, height: 60,
      };
      addObject(customEffectObject);
      setSelectedIds([customEffectObject.id]);
      return;
    }

    const presetIndex = parseInt(effectData, 10);
    if (isNaN(presetIndex)) return;
    const preset = EFFECT_PRESETS[presetIndex];
    if (!preset) return;

    const hitUnit = objectOrder.map((id) => objectsById[id]).filter((o) => o?.type === 'unit').find((u) => {
      const s = (u.width || 50) / 2;
      return Math.abs(stageX - u.x) < s && Math.abs(stageY - u.y) < s;
    });

    if (hitUnit) {
      const effect = createEffectFromPreset(preset, useEditorStore.getState().currentTime);
      addEffect(hitUnit.id, effect);
      setSelectedIds([hitUnit.id]);
    } else {
      const obj: MapObject = {
        id: uuid(), type: 'effect', effectType: preset.type, label: preset.label,
        x: stageX, y: stageY, rotation: 0, scaleX: 1, scaleY: 1,
        layer: 'effects', visible: true, locked: false, width: 60, height: 60,
      };
      addObject(obj);
      const effect = createEffectFromPreset(preset, useEditorStore.getState().currentTime);
      addEffect(obj.id, effect);
      setSelectedIds([obj.id]);
    }
  }, [stagePosition, stageScale, objectOrder, objectsById, addEffect, addObject, setSelectedIds, customEffects]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }, []);

  const handleObjectContextMenu = (id: string, e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    e.cancelBubble = true;

    // If we're drawing a path, right-click saves it instead of showing menu
    if (activeTool === 'path' && pathPoints.length >= 2) {
      finalizePath();
      return;
    }

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setContextMenu({ x: e.evt.clientX - rect.left, y: e.evt.clientY - rect.top, objectId: id });
  };

  const getGroupForObject = (objId: string) => {
    for (const group of Object.values(groups)) {
      if (group.memberIds.includes(objId)) return group;
    }
    return null;
  };

  /** Start drawing a path for a specific unit via context menu */
  const startPathForUnit = (unitId: string) => {
    setSelectedIds([unitId]);
    setActiveTool('path');
    setPathPoints([]);
    isDrawingPath.current = false;
    setContextMenu(null);
  };

  // Highlighted group members
  const highlightedGroupMemberIds = new Set<string>();
  let highlightGroupColor = '';
  for (const sid of selectedIds) {
    const g = getGroupForObject(sid);
    if (g) {
      g.memberIds.forEach((m) => highlightedGroupMemberIds.add(m));
      highlightGroupColor = g.color;
    }
  }

  const units = objectOrder.map((id) => objectsById[id]).filter((o) => o && (o.type === 'unit' || o.type === 'effect' || o.type === 'map_text'));
  const customIconSources = units.map((unit) => unit.customIcon).filter((src): src is string => Boolean(src));
  const customImageSources = customIconSources.filter((src) => !isVideoDataUrl(src));
  const customVideoSources = customIconSources.filter((src) => isVideoDataUrl(src));
  const builtInIconSources = Object.values(UNIT_ICON_URLS);
  const allIconSources = [...customImageSources, ...builtInIconSources];
  const iconImages = useImageCache(allIconSources);
  const videoEffects = useVideoCache(customVideoSources);
  const arrows = objectOrder.map((id) => objectsById[id]).filter((o) => o && o.type === 'drawing' && o.drawTool === 'arrow');
  const animatedArrows = objectOrder.map((id) => objectsById[id]).filter((o) => o && o.type === 'animated_arrow');

  useEffect(() => {
    const videos = Array.from(videoEffects.values());
    for (const video of videos) {
      if (isPlaying) {
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => undefined);
        }
      } else {
        video.pause();
      }
    }
  }, [isPlaying, videoEffects]);

  // Status bar text for path drawing
  const getPathStatusText = () => {
    if (activeTool !== 'path') return null;
    const sids = useEditorStore.getState().selectedIds;
    if (sids.length !== 1) return 'Select exactly 1 unit to draw a path';
    const unit = objectsById[sids[0]];
    const unitName = unit?.label || unit?.unitType || 'Unit';
    const durLabel = `Path duration: ${recordDurationSeconds}s (change in toolbar)`;
    const overwriteHint = 'Saving path replaces future movement from current time.';
    if (pathPoints.length === 0) {
      return `Drawing path for "${unitName}" — Left-click: add point, Right-click: save, Esc: cancel · ${durLabel} · ${overwriteHint}`;
    }
    return `${pathPoints.length} waypoints for "${unitName}" — Left-click: add, Right-click: save, Esc: cancel · ${durLabel} · ${overwriteHint}`;
  };

  const getPathStartAnchor = () => {
    if (activeTool !== 'path') return null;
    if (selectedIds.length !== 1) return null;

    const unitId = selectedIds[0];
    const unit = objectsById[unitId];
    if (!unit) return null;

    const unitStartTime = unit.startTime ?? 0;
    const pathStartTime = Math.max(currentTime, unitStartTime);
    const keyframes = activeScene.keyframesByObjectId[unitId] || [];
    const start = evaluateObjectAtTime(unit, keyframes, pathStartTime);
    return { x: start.x, y: start.y };
  };

  const pathStartAnchor = getPathStartAnchor();
  const previewPathPoints = pathStartAnchor ? [pathStartAnchor, ...pathPoints] : pathPoints;

  // Context menu sub-menu state
  const [contextSubMenu, setContextSubMenu] = useState<string | null>(null);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-canvas-bg tactical-grid overflow-hidden relative select-none"
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-panel/90 border border-border rounded text-[10px] font-mono text-muted-foreground">
        {Math.round(stageScale * 100)}% | {objectOrder.length} objects
      </div>

      {isRecording && (
        <div className="absolute top-2 left-2 z-10 px-3 py-1.5 bg-destructive/20 border border-destructive/50 rounded text-[10px] font-mono text-destructive flex items-center gap-2 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-destructive" /> REC — Drag units to record movement
        </div>
      )}

      {/* Path drawing status bar */}
      {activeTool === 'path' && (
        <div className="absolute top-2 left-2 z-10 px-3 py-1.5 bg-accent/20 border border-accent/50 rounded text-[10px] font-mono text-accent flex items-center gap-2">
          <Route size={12} />
          {getPathStatusText()}
        </div>
      )}

      <Stage
        ref={stageRef}
        width={dims.width}
        height={dims.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onContextMenu={handleStageContextMenu}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        {/* Background layer */}
        <Layer>
          <Rect id="bg-rect" x={0} y={0} width={1920} height={1080} fill="#0d1117" />
          {bgImage && <KImage image={bgImage} x={0} y={0} width={1920} height={1080} />}
          {Array.from({ length: 97 }, (_, i) => (
            <Line key={`vg-${i}`} id={`grid-v-${i}`} points={[i * 20, 0, i * 20, 1080]} stroke="#1a2332" strokeWidth={0.5} listening={false} />
          ))}
          {Array.from({ length: 55 }, (_, i) => (
            <Line key={`hg-${i}`} id={`grid-h-${i}`} points={[0, i * 20, 1920, i * 20]} stroke="#1a2332" strokeWidth={0.5} listening={false} />
          ))}
        </Layer>

        {/* Drawings layer */}
        <Layer>
          {arrows.map((d) => {
            if (!d.points || d.points.length < 4) return null;
            const color = d.color || '#d4a843';
            return (
              <Group key={d.id} x={d.x} y={d.y}>
                <Arrow points={d.points} stroke="#000000" strokeWidth={5} opacity={0.4} pointerLength={14} pointerWidth={12} lineCap="round" lineJoin="round" listening={false} />
                <Arrow points={d.points} stroke={color} strokeWidth={3} dash={[10, 6]} pointerLength={12} pointerWidth={10} fill={color} lineCap="round" lineJoin="round" opacity={0.9} />
              </Group>
            );
          })}
          {/* Animated arrows — progressive reveal during playback */}
          {animatedArrows.map((d) => {
            if (!d.points || d.points.length < 4) return null;
            const color = d.factionColor || d.color || '#d4a843';
            const isSelected = selectedIds.includes(d.id);
            const startT = d.animStartTime ?? 0;
            const endT = d.animEndTime ?? 1000;
            const duration = Math.max(endT - startT, 1);
            const progress = (isPlaying || Object.keys(derivedTransforms).length > 0)
              ? Math.max(0, Math.min(1, (currentTime - startT) / duration))
              : 1;
            if (progress <= 0 && isPlaying) return null;
            const showProgress = progress <= 0 ? 1 : progress; // Show full when before start in edit mode
            const pts = d.points;
            const x1 = pts[0], y1 = pts[1], x2 = pts[2], y2 = pts[3];
            const ex = x1 + (x2 - x1) * showProgress;
            const ey = y1 + (y2 - y1) * showProgress;
            return (
              <Group key={d.id}
                onClick={(e) => {
                  e.cancelBubble = true;
                  if (e.evt.shiftKey) {
                    setSelectedIds(selectedIds.includes(d.id) ? selectedIds.filter((id) => id !== d.id) : [...selectedIds, d.id]);
                  } else {
                    setSelectedIds([d.id]);
                  }
                }}
                onContextMenu={(e) => handleObjectContextMenu(d.id, e)}
              >
                <Arrow points={[x1, y1, ex, ey]} stroke="#000000" strokeWidth={5} opacity={0.4} pointerLength={14} pointerWidth={12} lineCap="round" lineJoin="round" />
                <Arrow points={[x1, y1, ex, ey]} stroke={color} strokeWidth={3} pointerLength={12} pointerWidth={10} fill={color} lineCap="round" lineJoin="round" opacity={0.9} />
                {isSelected && (
                  <Arrow points={[x1, y1, x2, y2]} stroke="#ffffff" strokeWidth={1} dash={[4, 4]} pointerLength={10} pointerWidth={8} opacity={0.4} listening={false} />
                )}
                {!isPlaying && (
                  <Text x={x1} y={y1 - 16} text={`▶ ${((endT - startT) / 1000).toFixed(1)}s`} fontSize={9} fontFamily="JetBrains Mono, monospace" fill={color} opacity={0.7} listening={false} />
                )}
              </Group>
            );
          })}
          {drawingArrow && (
            <Arrow points={[drawingArrow.x1, drawingArrow.y1, drawingArrow.x2, drawingArrow.y2]} stroke="#d4a843" strokeWidth={3} dash={[10, 6]} pointerLength={12} pointerWidth={10} fill="#d4a843" opacity={0.6} listening={false} />
          )}
          {pathStartAnchor && (
            <>
              {previewPathPoints.length > 1 && (
                <Line points={previewPathPoints.flatMap((p) => [p.x, p.y])} stroke="#00bcd4" strokeWidth={2} dash={[6, 4]} opacity={0.8} listening={false} />
              )}
              <Circle x={pathStartAnchor.x} y={pathStartAnchor.y} radius={6} fill="#1de9b6" stroke="#ffffff" strokeWidth={2} opacity={0.95} listening={false} />
              <Text x={pathStartAnchor.x + 8} y={pathStartAnchor.y - 16} text="Start" fontSize={10} fill="#1de9b6" listening={false} />
              {pathPoints.map((p, i) => (
                <Circle key={`pp-${i}`} x={p.x} y={p.y} radius={4} fill="#00bcd4" stroke="#fff" strokeWidth={1} opacity={0.9} listening={false} />
              ))}
            </>
          )}
        </Layer>

        {/* Units & effects layer */}
        <Layer>
          {units.map((unit) => {
            const isSelected = selectedIds.includes(unit.id);
            const isGroupHighlighted = highlightedGroupMemberIds.has(unit.id) && !isSelected;
            const size = unit.width || 50;
            const derived = getObjectTransform(unit.id);
            const ux = derived ? derived.x : unit.x;
            const uy = derived ? derived.y : unit.y;
            const urot = derived ? derived.rotation : unit.rotation;
            const usx = derived ? derived.scaleX : unit.scaleX;
            const usy = derived ? derived.scaleY : unit.scaleY;
            const uvis = derived ? derived.visible : unit.visible;
            if (!uvis) return null;

            // Time range visibility check
            const sceneDuration = activeScene.duration;
            const unitStart = unit.startTime ?? 0;
            const unitEnd = unit.endTime ?? sceneDuration;
            const isInTimeRange = currentTime >= unitStart && currentTime <= unitEnd;
            // During playback, hide units outside their time range
            if (isPlaying && !isInTimeRange) return null;
            // In edit mode, dim units outside their time range
            const isOutsideRange = !isInTimeRange;

            // Fade opacity calculation
            let fadeOpacity = 1;
            if (isInTimeRange) {
              const fadeIn = unit.fadeInDuration ?? 0;
              const fadeOut = unit.fadeOutDuration ?? 0;
              if (fadeIn > 0 && currentTime < unitStart + fadeIn) {
                fadeOpacity = Math.max(0, (currentTime - unitStart) / fadeIn);
              }
              if (fadeOut > 0 && currentTime > unitEnd - fadeOut) {
                fadeOpacity = Math.min(fadeOpacity, Math.max(0, (unitEnd - currentTime) / fadeOut));
              }
            }
            const groupOpacity = isOutsideRange ? 0.25 : fadeOpacity;

            const customIconImage = unit.customIcon ? iconImages.get(unit.customIcon) : null;
            const customVideoElement = unit.customIcon ? videoEffects.get(unit.customIcon) : null;
            const builtInIconUrl = UNIT_ICON_URLS[unit.unitType || 'infantry'];
            const builtInIconImage = builtInIconUrl ? iconImages.get(builtInIconUrl) : null;
            const isStandaloneEffect = unit.type === 'effect';
            const unitEffects = derivedEffects[unit.id] || [];
            const shakeOffset = getShakeOffset(unitEffects, currentTime);
            const group = getGroupForObject(unit.id);
            const staticEffects = activeScene.effectsByObjectId[unit.id] || [];

            // Determine if we should show the faction box
            const hasFactionColor = unit.factionColor && unit.factionColor !== 'none';

            return (
              <Group
                key={unit.id}
                id={`unit-${unit.id}`}
                x={ux + shakeOffset.dx}
                y={uy + shakeOffset.dy}
                rotation={urot}
                scaleX={usx}
                scaleY={usy}
                opacity={groupOpacity}
                draggable={!isPlaying && (activeTool === 'select' || isRecording) && !unit.locked}
                onClick={(e) => {
                  if (isPlaying) return;
                  e.cancelBubble = true;
                  if (e.evt.shiftKey) {
                    setSelectedIds(selectedIds.includes(unit.id) ? selectedIds.filter((id) => id !== unit.id) : [...selectedIds, unit.id]);
                  } else {
                    setSelectedIds([unit.id]);
                  }
                }}
                onContextMenu={(e) => handleObjectContextMenu(unit.id, e)}
                onDragStart={(e) => handleDragStart(unit.id, e)}
                onDragMove={(e) => handleDragMove(unit.id, e)}
                onDragEnd={(e) => handleDragEnd(unit.id, e)}
              >
                {/* Group highlight */}
                {isGroupHighlighted && (
                  <Rect x={-size / 2 - 6} y={-size / 2 - 6} width={size + 12} height={size + 12} stroke={highlightGroupColor} strokeWidth={2} dash={[4, 3]} cornerRadius={6} opacity={0.7} listening={false} />
                )}

                {/* Selection ring */}
                {isSelected && (
                  <Rect x={-size / 2 - 4} y={-size / 2 - 4} width={size + 8} height={size + 8} stroke={group ? group.color : UNIT_COLOR} strokeWidth={2} dash={selectedIds.length > 1 ? [6, 3] : [4, 4]} cornerRadius={4} />
                )}

                {/* Unit body */}
                {!isStandaloneEffect && unit.type === 'unit' && (() => {
                  const unitColor = hasFactionColor ? unit.factionColor! : UNIT_COLOR;
                  return (
                    <>
                      {/* Only show background rect if faction color is set */}
                      {hasFactionColor && (
                        <Rect x={-size / 2} y={-size / 2} width={size} height={size} fill={`${unitColor}44`} stroke={unitColor} strokeWidth={2} cornerRadius={4} />
                      )}
                      {customIconImage && <KImage image={customIconImage} x={-size / 2 + (hasFactionColor ? 4 : 0)} y={-size / 2 + (hasFactionColor ? 4 : 0)} width={size - (hasFactionColor ? 8 : 0)} height={size - (hasFactionColor ? 8 : 0)} />}
                      {!customIconImage && builtInIconImage && <KImage image={builtInIconImage} x={-size / 2 + (hasFactionColor ? 2 : 0)} y={-size / 2 + (hasFactionColor ? 2 : 0)} width={size - (hasFactionColor ? 4 : 0)} height={size - (hasFactionColor ? 4 : 0)} />}
                      {!customIconImage && !builtInIconImage && (
                        <Text x={-size / 2} y={-size / 2 + 4} width={size} text={UNIT_LABELS[unit.unitType || 'infantry'] || '?'} fontSize={size * 0.35} fontFamily="JetBrains Mono, monospace" fontStyle="bold" align="center" fill={unitColor} />
                      )}
                      {hasFactionColor && <Circle x={size / 2 - 4} y={-size / 2 + 4} radius={4} fill={unitColor} />}
                      {group && (
                        <>
                          <Circle x={-size / 2 + 4} y={-size / 2 + 4} radius={5} fill={group.color} opacity={0.9} listening={false} />
                          <Text x={-size / 2 + 1} y={-size / 2 + 0.5} text={group.name.charAt(0).toUpperCase()} fontSize={7} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill="#fff" width={7} align="center" listening={false} />
                        </>
                      )}
                      {/* Effect badges */}
                      {staticEffects.slice(0, 3).map((eff, i) => (
                        <React.Fragment key={eff.id}>
                          <Circle x={size / 2 - 4 - i * 9} y={size / 2 - 4} radius={4} fill={EFFECT_COLORS[eff.type] || '#ff6600'} opacity={0.85} listening={false} />
                          <Text x={size / 2 - 7 - i * 9} y={size / 2 - 8} text={EFFECT_VISUAL_SYMBOLS[eff.type] || '?'} fontSize={6} listening={false} />
                        </React.Fragment>
                      ))}
                      {staticEffects.length > 3 && (
                        <Text x={size / 2 - 4 - 3 * 9} y={size / 2 - 7} text={`+${staticEffects.length - 3}`} fontSize={6} fontFamily="JetBrains Mono, monospace" fill="#fff" listening={false} />
                      )}
                    </>
                  );
                })()}

                {/* Map text rendering */}
                {unit.type === 'map_text' && (
                  <>
                    {unit.bgColor && (
                      <Rect x={-100} y={-(unit.fontSize || 20) / 2 - 4} width={200} height={(unit.fontSize || 20) + 8} fill={unit.bgColor} opacity={0.7} cornerRadius={3} listening={false} />
                    )}
                    <Text
                      x={-150} y={-(unit.fontSize || 20) / 2}
                      width={300}
                      text={unit.text || 'Text'}
                      fontSize={unit.fontSize || 20}
                      fontFamily="JetBrains Mono, monospace"
                      fontStyle="bold"
                      fill={unit.fontColor || '#ffffff'}
                      align="center"
                      listening={false}
                    />
                    {isSelected && (
                      <Rect x={-100} y={-(unit.fontSize || 20) / 2 - 6} width={200} height={(unit.fontSize || 20) + 12} stroke="#ffffff" strokeWidth={1} dash={[4, 3]} cornerRadius={3} opacity={0.5} listening={false} />
                    )}
                  </>
                )}

                {/* Standalone effect placeholder */}
                {isStandaloneEffect && !isPlaying && (
                  <>
                    <Circle x={0} y={0} radius={size * 0.4} fill={(EFFECT_COLORS[unit.effectType || ''] || '#ff6600') + '15'} stroke={(EFFECT_COLORS[unit.effectType || ''] || '#ff6600') + '66'} strokeWidth={1.5} dash={[4, 3]} listening={true} />
                    {customVideoElement ? (
                      <KImage image={customVideoElement} x={-size / 2 + 8} y={-size / 2 + 8} width={size - 16} height={size - 16} />
                    ) : customIconImage ? (
                      <KImage image={customIconImage} x={-size / 2 + 8} y={-size / 2 + 8} width={size - 16} height={size - 16} />
                    ) : (
                      <Text x={-size / 2} y={-8} width={size} text={EFFECT_VISUAL_SYMBOLS[unit.effectType || ''] || '💥'} fontSize={16} align="center" listening={false} />
                    )}
                    <Text x={-size / 2} y={10} width={size} text={unit.label || unit.effectType || 'FX'} fontSize={8} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={EFFECT_COLORS[unit.effectType || ''] || '#ff8844'} align="center" listening={false} />
                    {staticEffects.length > 0 && (
                      <Text x={-size / 2} y={20} width={size} text={`${(staticEffects[0].startTime / 1000).toFixed(1)}s`} fontSize={7} fontFamily="JetBrains Mono, monospace" fill={(EFFECT_COLORS[unit.effectType || ''] || '#ff8844') + '88'} align="center" listening={false} />
                    )}
                  </>
                )}
                {isStandaloneEffect && isPlaying && (
                  <Circle x={0} y={0} radius={size * 0.4} fill="transparent" listening={false} />
                )}

                {/* Effect overlays */}
                <CrackEffect size={size} effects={unitEffects} />
                <BloodEffect size={size} effects={unitEffects} />
                <ExplosionEffect size={size} effects={unitEffects} />
                <SmokeEffect size={size} effects={unitEffects} currentTime={currentTime} />
                <FireEffect size={size} effects={unitEffects} currentTime={currentTime} />
                <GunshotEffect size={size} effects={unitEffects} />
              </Group>
            );
          })}
        </Layer>

        {/* Selection rectangle overlay */}
        {selectionRect && (
          <Layer>
            <Rect
              x={Math.min(selectionRect.x1, selectionRect.x2)}
              y={Math.min(selectionRect.y1, selectionRect.y2)}
              width={Math.abs(selectionRect.x2 - selectionRect.x1)}
              height={Math.abs(selectionRect.y2 - selectionRect.y1)}
              fill="rgba(212,168,67,0.1)"
              stroke="#d4a843"
              strokeWidth={1}
              dash={[6, 3]}
              listening={false}
            />
          </Layer>
        )}
      </Stage>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="absolute z-50 bg-panel border border-border rounded shadow-lg py-1 min-w-[180px] max-h-[400px] overflow-y-auto scrollbar-tactical"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* If right-clicked on a unit */}
          {contextMenu.objectId && (
            <>
              {/* Draw Path option — only for units */}
              {objectsById[contextMenu.objectId]?.type === 'unit' && (
                <>
                  <button onClick={() => startPathForUnit(contextMenu.objectId!)}
                    className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                    <Route size={10} /> Draw Path
                  </button>
                  <div className="h-px bg-border my-1" />
                </>
              )}
              {Object.values(groups).length > 0 && (
                <>
                  <div className="px-3 py-1 text-[8px] font-mono uppercase text-muted-foreground">Add to Group</div>
                  {Object.values(groups).map((g) => (
                    <button key={g.id} onClick={() => { addToGroup(g.id, [contextMenu.objectId!]); setContextMenu(null); }}
                      className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-foreground hover:bg-muted transition-colors flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} /> {g.name}
                    </button>
                  ))}
                  <div className="h-px bg-border my-1" />
                </>
              )}
              <button onClick={() => { setSelectedIds([contextMenu.objectId!]); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-foreground hover:bg-muted transition-colors">Select</button>
              {getGroupForObject(contextMenu.objectId) && (
                <button onClick={() => {
                  const g = getGroupForObject(contextMenu.objectId!);
                  if (g) useEditorStore.getState().removeFromGroup(g.id, [contextMenu.objectId!]);
                  setContextMenu(null);
                }} className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-foreground hover:bg-muted transition-colors">
                  Remove from Group
                </button>
              )}
            </>
          )}

          {/* If right-clicked on empty space — Add menu */}
          {!contextMenu.objectId && (
            <>
              <div className="px-3 py-1 text-[8px] font-mono uppercase text-muted-foreground tracking-wider">Add to Map</div>
              {UNIT_CATEGORIES.map((cat) => {
                const items = UNIT_TYPES.filter((u) => u.category === cat.key);
                const isOpen = contextSubMenu === cat.key;
                return (
                  <div key={cat.key}>
                    <button
                      onClick={() => setContextSubMenu(isOpen ? null : cat.key)}
                      className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                    >
                      <span>{cat.icon}</span>
                      <span className="flex-1">{cat.label}</span>
                      <span className="text-muted-foreground text-[8px]">{isOpen ? '▾' : '▸'}</span>
                    </button>
                    {isOpen && (
                      <div className="pl-4 bg-muted/30">
                        {items.map((u) => (
                          <button
                            key={u.type}
                            onClick={() => handleAddUnitAtCursor(u.type)}
                            className="w-full text-left px-3 py-1 text-[9px] font-mono text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                          >
                            <img src={UNIT_ICON_URLS[u.type]} alt={u.label} className="w-4 h-4 object-contain" /> {u.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="h-px bg-border my-1" />
              <div className="px-3 py-1 text-[8px] font-mono uppercase text-muted-foreground tracking-wider">Effects</div>
              {EFFECT_PRESETS.map((preset, idx) => (
                <button
                  key={preset.type}
                  onClick={() => handleAddEffectAtCursor(idx)}
                  className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <span>{preset.icon}</span> {preset.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MapCanvas;
