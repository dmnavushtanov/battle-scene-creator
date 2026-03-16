import { useState, useRef, useCallback } from 'react';
import Konva from 'konva';
import { createLogger } from '@/utils/logger';
import type { MapObject } from '@/domain/models';

const logger = createLogger('useMarqueeSelection');

interface MarqueeRect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface SelectionOptions {
  activeTool: string;
  isPlaying: boolean;
  objectOrder: string[];
  objectsById: Record<string, MapObject>;
  setSelectedIds: (ids: string[]) => void;
  getStageCoords: (pointer: { x: number; y: number }) => { x: number; y: number };
  getSelectionBounds: (obj: MapObject, id: string) => { minX: number; minY: number; maxX: number; maxY: number };
  isCanvasBackgroundTarget: (target: Konva.Node | null) => boolean;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function useMarqueeSelection({
  activeTool,
  isPlaying,
  objectOrder,
  objectsById,
  setSelectedIds,
  getStageCoords,
  getSelectionBounds,
  isCanvasBackgroundTarget,
  stageRef
}: SelectionOptions) {
  const [selectionRect, setSelectionRect] = useState<MarqueeRect | null>(null);
  const selectionRectRef = useRef<MarqueeRect | null>(null);
  const isMarqueeSelecting = useRef(false);
  const ignoreNextStageClick = useRef(false);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 0 && activeTool === 'select' && !isPlaying) {
      const target = e.target;
      const stage = stageRef.current;
      if (isCanvasBackgroundTarget(target) && stage) {
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const coords = getStageCoords(pointer);
        const nextRect = { x1: coords.x, y1: coords.y, x2: coords.x, y2: coords.y };
        isMarqueeSelecting.current = true;
        selectionRectRef.current = nextRect;
        setSelectionRect(nextRect);
        logger.debug('Marquee started', coords);
      }
    }
  }, [activeTool, isPlaying, getStageCoords, isCanvasBackgroundTarget, stageRef]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isMarqueeSelecting.current && selectionRectRef.current) {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const coords = getStageCoords(pointer);
      const nextRect = { ...selectionRectRef.current, x2: coords.x, y2: coords.y };
      selectionRectRef.current = nextRect;
      setSelectionRect(nextRect);
    }
  }, [getStageCoords, stageRef]);

  const handleMouseUp = useCallback(() => {
    const finalSelectionRect = selectionRectRef.current;
    if (isMarqueeSelecting.current && finalSelectionRect) {
      isMarqueeSelecting.current = false;
      const minX = Math.min(finalSelectionRect.x1, finalSelectionRect.x2);
      const maxX = Math.max(finalSelectionRect.x1, finalSelectionRect.x2);
      const minY = Math.min(finalSelectionRect.y1, finalSelectionRect.y2);
      const maxY = Math.max(finalSelectionRect.y1, finalSelectionRect.y2);

      // Only select if dragged at least 5px
      if (maxX - minX > 5 || maxY - minY > 5) {
        const matchingIds = objectOrder.filter((id) => {
          const obj = objectsById[id];
          if (!obj) return false;
          const bounds = getSelectionBounds(obj, id);
          return bounds.maxX >= minX && bounds.minX <= maxX && bounds.maxY >= minY && bounds.minY <= maxY;
        });

        logger.info('Marquee selection finalized', { count: matchingIds.length });
        setSelectedIds(matchingIds);
        ignoreNextStageClick.current = true;
      }
      selectionRectRef.current = null;
      setSelectionRect(null);
    }
  }, [objectOrder, objectsById, getSelectionBounds, setSelectedIds]);

  const resetIgnoreNextClick = useCallback(() => {
    const wasIgnored = ignoreNextStageClick.current;
    ignoreNextStageClick.current = false;
    return wasIgnored;
  }, []);

  return {
    selectionRect,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetIgnoreNextClick,
    isMarqueeSelecting: isMarqueeSelecting.current
  };
}
