import { useState, useRef, useCallback } from 'react';
import Konva from 'konva';
import { createLogger } from '@/utils/logger';
import { v4 as uuid } from 'uuid';
import type { MapObject, Scene } from '@/domain/models';
import { evaluateObjectAtTime } from '@/domain/services/timeline';
import { toast } from '@/hooks/use-toast';

const logger = createLogger('usePathDrawing');

interface PathDrawingOptions {
  activeTool: string;
  activeScene: Scene;
  recordDurationSeconds: number;
  currentTime: number;
  selectedIds: string[];
  addObject: (obj: MapObject) => void;
  setSelectedIds: (ids: string[]) => void;
  setActiveTool: (tool: string) => void;
  replaceKeyframesFromTime: (objectId: string, fromTime: number, newKeyframes: any[]) => void;
  setSceneDuration: (ms: number) => void;
  getStageCoords: (pointer: { x: number; y: number }) => { x: number; y: number };
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function usePathDrawing({
  activeTool,
  activeScene,
  recordDurationSeconds,
  currentTime,
  selectedIds,
  addObject,
  setSelectedIds,
  setActiveTool,
  replaceKeyframesFromTime,
  setSceneDuration,
  getStageCoords,
  stageRef
}: PathDrawingOptions) {
  const [pathPoints, setPathPoints] = useState<{ x: number; y: number }[]>([]);
  const isDrawingPath = useRef(false);

  const finalizePath = useCallback(() => {
    if (pathPoints.length < 2) {
      logger.warn('Path drawing aborted: too few points');
      return;
    }

    if (selectedIds.length !== 1) {
      logger.warn('Path drawing aborted: must select exactly 1 unit', { selectedCount: selectedIds.length });
      setPathPoints([]);
      isDrawingPath.current = false;
      setActiveTool('select');
      return;
    }

    const unitId = selectedIds[0];
    const durMs = recordDurationSeconds * 1000;
    const obj = activeScene.objectsById[unitId];

    if (!obj) {
      logger.error('Path drawing aborted: unit not found', { unitId });
      setPathPoints([]);
      isDrawingPath.current = false;
      setActiveTool('select');
      return;
    }

    const unitStartTime = obj.startTime ?? 0;
    const pathStartTime = Math.max(currentTime, unitStartTime);
    const existingKeyframes = activeScene.keyframesByObjectId[unitId] || [];
    const hasOverwrittenFutureKeyframes = existingKeyframes.some((kf) => kf.time >= pathStartTime);
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

    logger.info('Finalizing path', { unitId, points: keyframes.length, duration: durMs });
    replaceKeyframesFromTime(unitId, pathStartTime, keyframes);

    if (hasOverwrittenFutureKeyframes) {
      toast({
        title: 'Path saved',
        description: 'Replaced future movement from this point.',
      });
    }

    const endTime = pathStartTime + durMs;
    if (endTime > activeScene.duration) {
      setSceneDuration(Math.ceil(endTime / 1000) * 1000);
    }

    setPathPoints([]);
    isDrawingPath.current = false;
    setActiveTool('select');
  }, [pathPoints, selectedIds, recordDurationSeconds, activeScene, currentTime, setActiveTool, replaceKeyframesFromTime, setSceneDuration]);

  const handleStageClick = useCallback(() => {
    if (activeTool !== 'path') return;
    const stage = stageRef.current;
    if (!stage) return;

    if (selectedIds.length !== 1) {
      logger.warn('Path drawing hint: select exactly 1 unit');
      return;
    }

    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const coords = getStageCoords(pointer);

    logger.debug('Adding path point', coords);
    isDrawingPath.current = true;
    setPathPoints((prev) => [...prev, coords]);
  }, [activeTool, selectedIds, getStageCoords, stageRef]);

  const handleStageContextMenu = useCallback((e: any) => {
    if (activeTool === 'path') {
      e.evt.preventDefault();
      if (pathPoints.length >= 2) {
        finalizePath();
      }
    }
  }, [activeTool, pathPoints.length, finalizePath]);

  const cancelPath = useCallback(() => {
    logger.info('Path drawing cancelled');
    setPathPoints([]);
    isDrawingPath.current = false;
    setActiveTool('select');
  }, [setActiveTool]);

  const getPathStatusText = useCallback(() => {
    if (activeTool !== 'path') return null;
    if (selectedIds.length !== 1) return 'Select exactly 1 unit to draw a path';
    const unit = activeScene.objectsById[selectedIds[0]];
    const unitName = unit?.label || unit?.unitType || 'Unit';
    const durLabel = `Path duration: ${recordDurationSeconds}s (change in toolbar)`;
    const startHint = 'Start is locked to the unit\'s current position.';
    const overwriteHint = 'Saving this path replaces future movement.';
    const saveHint = pathPoints.length < 2 ? 'Add at least 2 points to save.' : 'Right-click to save.';
    if (pathPoints.length === 0) {
      return `Drawing path for "${unitName}" — Left-click: add point, Esc: cancel · ${saveHint} · ${startHint} · ${durLabel} · ${overwriteHint}`;
    }
    return `${pathPoints.length} points for "${unitName}" — Left-click: add, Esc: cancel · ${saveHint} · ${startHint} · ${durLabel} · ${overwriteHint}`;
  }, [activeTool, selectedIds, activeScene.objectsById, recordDurationSeconds, pathPoints.length]);

  return {
    pathPoints,
    isDrawingPath: isDrawingPath.current,
    finalizePath,
    handleStageClick,
    handleStageContextMenu,
    cancelPath,
    getPathStatusText
  };
}
