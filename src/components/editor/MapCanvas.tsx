import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Image as KImage, Group, Text, Circle, Line, Arrow } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '@/store/editorStore';
import type { ActiveEffect } from '@/domain/models';

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

const customIconCache = new Map<string, HTMLImageElement>();

function useCustomIconCache(sources: string[]) {
  const [, forceRerender] = useState(0);

  useEffect(() => {
    let cancelled = false;
    sources.forEach((src) => {
      if (!src || customIconCache.has(src)) return;
      const image = new window.Image();
      image.src = src;
      image.onload = () => {
        customIconCache.set(src, image);
        if (!cancelled) forceRerender((v) => v + 1);
      };
    });
    return () => { cancelled = true; };
  }, [sources]);

  return customIconCache;
}

/** Compute shake offset based on active effects */
function getShakeOffset(effects: ActiveEffect[], time: number): { dx: number; dy: number } {
  let dx = 0;
  let dy = 0;
  for (const eff of effects) {
    if ((eff.type === 'shake' || eff.type === 'explosion') && !eff.ended) {
      const freq = 40; // Hz
      const amplitude = eff.intensity * 8;
      const decay = 1 - eff.progress;
      dx += Math.sin(time * freq * 0.1) * amplitude * decay;
      dy += Math.cos(time * freq * 0.13) * amplitude * decay;
    }
  }
  return { dx, dy };
}

const MapCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dims, setDims] = React.useState({ width: 800, height: 600 });
  const [bgImage, setBgImage] = React.useState<HTMLImageElement | null>(null);
  const lastDragPos = useRef<{ x: number; y: number } | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number; stageX: number; stageY: number } | null>(null);

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

  useEffect(() => {
    (window as any).__konvaStageRef = stageRef;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDims({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
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

  const panDidMove = useRef(false);

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target;
    const isEmptySpace = target === target.getStage() || target.attrs.id === 'bg-rect' || target.attrs.id?.startsWith('grid-');
    if (isEmptySpace && activeTool === 'select' && !isRecording) {
      isPanning.current = true;
      panDidMove.current = false;
      const stage = stageRef.current;
      if (stage) {
        const pointer = stage.getPointerPosition()!;
        panStart.current = { x: pointer.x, y: pointer.y, stageX: stagePosition.x, stageY: stagePosition.y };
        stage.container().style.cursor = 'grabbing';
      }
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning.current || !panStart.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition()!;
    const dx = pointer.x - panStart.current.x;
    const dy = pointer.y - panStart.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) panDidMove.current = true;
    setStagePosition({ x: panStart.current.stageX + dx, y: panStart.current.stageY + dy });
  };

  const handleStageMouseUp = () => {
    if (isPanning.current) {
      if (!panDidMove.current) setSelectedIds([]);
      isPanning.current = false;
      panStart.current = null;
      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = 'default';
    }
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const target = e.target;
    const isEmptySpace = target === target.getStage() || target.attrs.id === 'bg-rect';
    if (isEmptySpace && !panDidMove.current) setSelectedIds([]);
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
      onGroupDragMove(id, x - prev.x, y - prev.y);
    }
    lastDragPos.current = { x, y };
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    onObjectDragEnd(id, e.target.x(), e.target.y());
    lastDragPos.current = null;
  };

  const getObjectTransform = (id: string) => {
    if (isPlaying && derivedTransforms[id]) return derivedTransforms[id];
    return null;
  };

  const units = objectOrder.map((id) => objectsById[id]).filter((o) => o && o.type === 'unit');

  const customIconSources = units.map((unit) => unit.customIcon).filter((src): src is string => Boolean(src));
  const customIconImages = useCustomIconCache(customIconSources);

  const arrows = objectOrder.map((id) => objectsById[id]).filter((o) => o && o.type === 'drawing' && o.drawTool === 'arrow');

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
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
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

            const customIconImage = unit.customIcon ? customIconImages.get(unit.customIcon) : null;
            const hasCustomIcon = Boolean(customIconImage);

            // Effects
            const unitEffects = derivedEffects[unit.id] || [];
            const shakeOffset = getShakeOffset(unitEffects, currentTime);
            const hasCrack = unitEffects.some((e) => e.type === 'crack');
            const hasBlood = unitEffects.some((e) => e.type === 'blood');
            const hasExplosion = unitEffects.some((e) => e.type === 'explosion' && !e.ended);
            const hasSmoke = unitEffects.some((e) => e.type === 'smoke' && !e.ended);
            const hasFire = unitEffects.some((e) => e.type === 'fire' && !e.ended);
            const explosionEffect = unitEffects.find((e) => e.type === 'explosion' && !e.ended);
            const smokeEffect = unitEffects.find((e) => e.type === 'smoke' && !e.ended);
            const fireEffect = unitEffects.find((e) => e.type === 'fire' && !e.ended);

            return (
              <Group
                key={unit.id}
                id={`unit-${unit.id}`}
                x={ux + shakeOffset.dx}
                y={uy + shakeOffset.dy}
                rotation={urot}
                scaleX={usx}
                scaleY={usy}
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
                onDragStart={(e) => handleDragStart(unit.id, e)}
                onDragMove={(e) => handleDragMove(unit.id, e)}
                onDragEnd={(e) => handleDragEnd(unit.id, e)}
              >
                {/* Selection ring */}
                {isSelected && (
                  <Rect x={-size / 2 - 4} y={-size / 2 - 4} width={size + 8} height={size + 8} stroke={UNIT_COLOR} strokeWidth={2} dash={[4, 4]} cornerRadius={4} />
                )}

                {/* Unit body */}
                <Rect x={-size / 2} y={-size / 2} width={size} height={size} fill={`${UNIT_COLOR}44`} stroke={UNIT_COLOR} strokeWidth={2} cornerRadius={4} />

                {/* Custom uploaded icon */}
                {hasCustomIcon && (
                  <KImage image={customIconImage!} x={-size / 2 + 4} y={-size / 2 + 4} width={size - 8} height={size - 8} />
                )}

                {/* Default: emoji symbol + label */}
                {!hasCustomIcon && (
                  <>
                    <Text x={-size / 2} y={-size / 2 + 4} width={size} text={UNIT_SYMBOLS[unit.unitType || 'infantry'] || '?'} fontSize={size * 0.4} align="center" fill={UNIT_COLOR} />
                    <Text x={-size / 2} y={size / 2 - 14} width={size} text={UNIT_LABELS[unit.unitType || 'infantry'] || '?'} fontSize={9} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={UNIT_COLOR} align="center" />
                  </>
                )}

                {/* Top-right dot */}
                <Circle x={size / 2 - 4} y={-size / 2 + 4} radius={4} fill={UNIT_COLOR} />

                {/* === EFFECT OVERLAYS === */}

                {/* Crack overlay: diagonal lines across the unit */}
                {hasCrack && (
                  <>
                    <Line points={[-size / 2 + 5, -size / 2 + 5, 2, 0, size / 2 - 5, size / 2 - 5]} stroke="#888" strokeWidth={2} opacity={0.8} listening={false} />
                    <Line points={[size / 2 - 8, -size / 2 + 3, -2, 3, -size / 2 + 8, size / 2 - 8]} stroke="#666" strokeWidth={1.5} opacity={0.7} listening={false} />
                    <Line points={[-size / 2 + 10, 0, 0, 5, size / 2 - 3, -3]} stroke="#555" strokeWidth={1} opacity={0.6} listening={false} />
                  </>
                )}

                {/* Blood overlay: red circles splattered */}
                {hasBlood && (
                  <>
                    <Circle x={-5} y={3} radius={6} fill="#8b0000" opacity={0.6} listening={false} />
                    <Circle x={8} y={-4} radius={4} fill="#a00" opacity={0.5} listening={false} />
                    <Circle x={-2} y={10} radius={3} fill="#900" opacity={0.55} listening={false} />
                    <Circle x={6} y={8} radius={5} fill="#8b0000" opacity={0.45} listening={false} />
                  </>
                )}

                {/* Explosion burst: radial orange/red circles */}
                {hasExplosion && explosionEffect && (
                  <>
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                      const rad = (angle * Math.PI) / 180;
                      const dist = size * 0.6 * explosionEffect.progress;
                      const opacity = (1 - explosionEffect.progress) * explosionEffect.intensity;
                      return (
                        <Circle
                          key={`exp-${i}`}
                          x={Math.cos(rad) * dist}
                          y={Math.sin(rad) * dist}
                          radius={4 + explosionEffect.progress * 6}
                          fill={i % 2 === 0 ? '#ff6600' : '#ff2200'}
                          opacity={opacity}
                          listening={false}
                        />
                      );
                    })}
                    <Circle x={0} y={0} radius={size * 0.3 * (1 - explosionEffect.progress)} fill="#ffaa00" opacity={(1 - explosionEffect.progress) * 0.8} listening={false} />
                  </>
                )}

                {/* Smoke: fading gray circles rising */}
                {hasSmoke && smokeEffect && (
                  <>
                    {[0, 1, 2].map((i) => {
                      const yOff = -i * 12 * smokeEffect.progress - 5;
                      const opacity = (1 - smokeEffect.progress * 0.7) * smokeEffect.intensity * 0.5;
                      return (
                        <Circle key={`smoke-${i}`} x={i * 6 - 6} y={yOff - size / 2} radius={8 + smokeEffect.progress * 10} fill="#666" opacity={opacity} listening={false} />
                      );
                    })}
                  </>
                )}

                {/* Fire: flickering orange/red circles */}
                {hasFire && fireEffect && (
                  <>
                    {[0, 1, 2].map((i) => {
                      const flicker = Math.sin(currentTime * 0.02 + i * 2) * 3;
                      return (
                        <Circle
                          key={`fire-${i}`}
                          x={i * 8 - 8 + flicker}
                          y={-size / 2 - 4 + Math.sin(currentTime * 0.015 + i) * 2}
                          radius={5 + Math.sin(currentTime * 0.03 + i) * 2}
                          fill={i % 2 === 0 ? '#ff4400' : '#ff8800'}
                          opacity={fireEffect.intensity * 0.7}
                          listening={false}
                        />
                      );
                    })}
                  </>
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default MapCanvas;
