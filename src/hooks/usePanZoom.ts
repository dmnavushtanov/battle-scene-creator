import { useCallback, useRef, useEffect } from 'react';
import Konva from 'konva';
import { createLogger } from '@/utils/logger';

const logger = createLogger('usePanZoom');

interface PanZoomOptions {
  stageScale: number;
  stagePosition: { x: number; y: number };
  setStageScale: (scale: number) => void;
  setStagePosition: (pos: { x: number; y: number }) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
}

export function usePanZoom({
  stageScale,
  stagePosition,
  setStageScale,
  setStagePosition,
  stageRef
}: PanZoomOptions) {
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number; stageX: number; stageY: number } | null>(null);
  const panTargetPos = useRef<{ x: number; y: number } | null>(null);
  const panRafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (panRafRef.current) {
        cancelAnimationFrame(panRafRef.current);
      }
    };
  }, []);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Continuous wheel zoom
      const zoomFactor = Math.exp(-e.evt.deltaY * 0.0015);
      const newScale = oldScale * zoomFactor;
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      const mousePointTo = {
        x: (pointer.x - stagePosition.x) / oldScale,
        y: (pointer.y - stagePosition.y) / oldScale,
      };

      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale
      };

      setStageScale(clampedScale);
      setStagePosition(newPos);

      logger.debug('Zoomed', { scale: clampedScale, x: newPos.x, y: newPos.y });
    },
    [stageScale, stagePosition, setStageScale, setStagePosition, stageRef]
  );

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button === 1) { // Middle mouse button
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      isPanning.current = true;
      panStart.current = {
        x: pointer.x,
        y: pointer.y,
        stageX: stagePosition.x,
        stageY: stagePosition.y
      };
      stage.container().style.cursor = 'grabbing';
      logger.debug('Pan started');
    }
  }, [stagePosition, stageRef]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isPanning.current && panStart.current) {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      panTargetPos.current = {
        x: panStart.current.stageX + pointer.x - panStart.current.x,
        y: panStart.current.stageY + pointer.y - panStart.current.y,
      };

      if (!panRafRef.current) {
        panRafRef.current = requestAnimationFrame(() => {
          if (panTargetPos.current) {
            setStagePosition(panTargetPos.current);
          }
          panRafRef.current = null;
        });
      }
    }
  }, [stageRef, setStagePosition]);

  const handleMouseUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null;
      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = 'default';
      logger.debug('Pan ended');
    }
  }, [stageRef]);

  return {
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isPanning: isPanning.current
  };
}
