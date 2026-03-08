import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Image as KImage, Group, Text, Circle, Line } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '@/store/editorStore';

const UNIT_SYMBOLS: Record<string, string> = {
  infantry: '⚔',
  cavalry: '🐎',
  armor: '⬣',
  artillery: '💣',
  naval: '⚓',
  air: '✈',
  hq: '★',
  supply: '📦',
};

const UNIT_LABELS: Record<string, string> = {
  infantry: 'INF',
  cavalry: 'CAV',
  armor: 'ARM',
  artillery: 'ART',
  naval: 'NAV',
  air: 'AIR',
  hq: 'HQ',
  supply: 'SUP',
};

const UNIT_COLOR = '#d4a843';

/** Hook to load an image from a URL/dataURL and return the HTMLImageElement */
function useLoadedImage(src: string | undefined): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!src) { setImg(null); return; }
    const image = new window.Image();
    image.src = src;
    image.onload = () => setImg(image);
    return () => { image.onload = null; };
  }, [src]);
  return img;
}

/** Cached image store for custom icons */
const imageCache = new Map<string, HTMLImageElement>();

function getCachedImage(src: string): HTMLImageElement | null {
  if (imageCache.has(src)) return imageCache.get(src)!;
  const img = new window.Image();
  img.src = src;
  img.onload = () => imageCache.set(src, img);
  return imageCache.get(src) || null;
}

/** Component for rendering a unit's custom icon on Konva */
const CustomIconImage: React.FC<{ src: string; size: number }> = ({ src, size }) => {
  const [img, setImg] = useState<HTMLImageElement | null>(() => getCachedImage(src));

  useEffect(() => {
    if (imageCache.has(src)) {
      setImg(imageCache.get(src)!);
      return;
    }
    const image = new window.Image();
    image.src = src;
    image.onload = () => {
      imageCache.set(src, image);
      setImg(image);
    };
  }, [src]);

  if (!img) return null;

  const padding = 4;
  const innerSize = size - padding * 2;
  return (
    <KImage
      image={img}
      x={-innerSize / 2}
      y={-innerSize / 2}
      width={innerSize}
      height={innerSize}
    />
  );
};

const MapCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dims, setDims] = React.useState({ width: 800, height: 600 });
  const [bgImage, setBgImage] = React.useState<HTMLImageElement | null>(null);

  const lastDragPos = useRef<{ x: number; y: number } | null>(null);

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

  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const updateObject = useEditorStore((s) => s.updateObject);
  const onObjectDragStart = useEditorStore((s) => s.onObjectDragStart);
  const onObjectDragMove = useEditorStore((s) => s.onObjectDragMove);
  const onObjectDragEnd = useEditorStore((s) => s.onObjectDragEnd);
  const onGroupDragMove = useEditorStore((s) => s.onGroupDragMove);
  const setStageScale = useEditorStore((s) => s.setStageScale);
  const setStagePosition = useEditorStore((s) => s.setStagePosition);

  const objectsById = activeScene.objectsById;
  const objectOrder = activeScene.objectOrder;
  const backgroundImage = activeScene.backgroundImage;

  // Expose stageRef for video export
  useEffect(() => {
    (window as any).__konvaStageRef = stageRef;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDims({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!backgroundImage) {
      setBgImage(null);
      return;
    }
    const img = new window.Image();
    img.src = backgroundImage;
    img.onload = () => setBgImage(img);
  }, [backgroundImage]);

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
      setStagePosition({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      });
    },
    [stageScale, stagePosition, setStageScale, setStagePosition]
  );

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() || e.target.attrs.id === 'bg-rect') {
      setSelectedIds([]);
    }
  };

  const handleDragStart = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    lastDragPos.current = { x: e.target.x(), y: e.target.y() };
    onObjectDragStart(id);
  };

  const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const x = e.target.x();
    const y = e.target.y();
    const prev = lastDragPos.current;
    onObjectDragMove(id, x, y);
    if (prev && selectedIds.includes(id) && selectedIds.length > 1) {
      const dx = x - prev.x;
      const dy = y - prev.y;
      onGroupDragMove(id, dx, dy);
    }
    lastDragPos.current = { x, y };
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const x = e.target.x();
    const y = e.target.y();
    onObjectDragEnd(id, x, y);
    lastDragPos.current = null;
  };

  const getObjectTransform = (id: string) => {
    if (!isRecording && derivedTransforms[id]) {
      return derivedTransforms[id];
    }
    return null;
  };

  const units = objectOrder
    .map((id) => objectsById[id])
    .filter((o) => o && o.type === 'unit');

  const drawings = objectOrder
    .map((id) => objectsById[id])
    .filter((o) => o && o.type === 'drawing');

  return (
    <div ref={containerRef} className="flex-1 bg-canvas-bg tactical-grid overflow-hidden relative">
      <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-panel/90 border border-border rounded text-[10px] font-mono text-muted-foreground">
        {Math.round(stageScale * 100)}% | {objectOrder.length} objects
      </div>

      {isRecording && (
        <div className="absolute top-2 left-2 z-10 px-3 py-1.5 bg-destructive/20 border border-destructive/50 rounded text-[10px] font-mono text-destructive flex items-center gap-2 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          REC — Drag units to record movement
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
        draggable={false}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        <Layer>
          <Rect
            id="bg-rect"
            x={0}
            y={0}
            width={1920}
            height={1080}
            fill="#0d1117"
            draggable={activeTool === 'select' && !isRecording}
            onDragMove={(e) => {
              // Pan the stage by moving the stage position
              e.target.x(0);
              e.target.y(0);
              setStagePosition({
                x: stagePosition.x + e.evt.movementX,
                y: stagePosition.y + e.evt.movementY,
              });
            }}
          />
          {bgImage && <KImage image={bgImage} x={0} y={0} width={1920} height={1080} />}
          {Array.from({ length: 97 }, (_, i) => (
            <Line key={`vg-${i}`} points={[i * 20, 0, i * 20, 1080]} stroke="#1a2332" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 55 }, (_, i) => (
            <Line key={`hg-${i}`} points={[0, i * 20, 1920, i * 20]} stroke="#1a2332" strokeWidth={0.5} />
          ))}
        </Layer>

        <Layer>
          {drawings.map((d) => {
            if (d.points && d.points.length >= 4) {
              return (
                <Line key={d.id} points={d.points} stroke={d.color || '#d4a843'} strokeWidth={2} x={d.x} y={d.y} />
              );
            }
            return null;
          })}
        </Layer>

        <Layer>
          {units.map((unit) => {
            const isSelected = selectedIds.includes(unit.id);
            const size = unit.width || 50;
            const derived = getObjectTransform(unit.id);
            const ux = derived ? derived.x : unit.x;
            const uy = derived ? derived.y : unit.y;
            const urot = derived ? derived.rotation : unit.rotation;
            const usx = derived ? derived.scaleX : unit.scaleX;
            const usy = derived ? derived.scaleY : unit.scaleY;
            const uvis = derived ? derived.visible : unit.visible;

            if (!uvis) return null;

            const hasCustomIcon = !!unit.customIcon;

            return (
              <Group
                key={unit.id}
                x={ux}
                y={uy}
                rotation={urot}
                scaleX={usx}
                scaleY={usy}
                draggable={!isPlaying && (activeTool === 'select' || isRecording) && !unit.locked}
                onClick={(e) => {
                  if (isPlaying) return;
                  e.cancelBubble = true;
                  if (e.evt.shiftKey) {
                    setSelectedIds(
                      selectedIds.includes(unit.id)
                        ? selectedIds.filter((id) => id !== unit.id)
                        : [...selectedIds, unit.id]
                    );
                  } else {
                    setSelectedIds([unit.id]);
                  }
                }}
                onDragStart={(e) => handleDragStart(unit.id, e)}
                onDragMove={(e) => handleDragMove(unit.id, e)}
                onDragEnd={(e) => handleDragEnd(unit.id, e)}
              >
                {/* Selection ring */}
                {isSelected && (
                  <Rect
                    x={-size / 2 - 4}
                    y={-size / 2 - 4}
                    width={size + 8}
                    height={size + 8}
                    stroke={UNIT_COLOR}
                    strokeWidth={2}
                    dash={[4, 4]}
                    cornerRadius={4}
                  />
                )}
                {/* Unit body */}
                <Rect
                  x={-size / 2}
                  y={-size / 2}
                  width={size}
                  height={size}
                  fill={`${UNIT_COLOR}44`}
                  stroke={UNIT_COLOR}
                  strokeWidth={2}
                  cornerRadius={4}
                />

                {/* Custom uploaded icon */}
                {hasCustomIcon && <CustomIconImage src={unit.customIcon!} size={size} />}

                {/* Default: emoji symbol + label */}
                {!hasCustomIcon && (
                  <>
                    <Text
                      x={-size / 2}
                      y={-size / 2 + 4}
                      width={size}
                      text={UNIT_SYMBOLS[unit.unitType || 'infantry'] || '?'}
                      fontSize={size * 0.4}
                      align="center"
                      fill={UNIT_COLOR}
                    />
                    <Text
                      x={-size / 2}
                      y={size / 2 - 14}
                      width={size}
                      text={UNIT_LABELS[unit.unitType || 'infantry'] || '?'}
                      fontSize={9}
                      fontFamily="JetBrains Mono, monospace"
                      fontStyle="bold"
                      fill={UNIT_COLOR}
                      align="center"
                    />
                  </>
                )}

                {/* Top-right dot */}
                <Circle x={size / 2 - 4} y={-size / 2 + 4} radius={4} fill={UNIT_COLOR} />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default MapCanvas;
