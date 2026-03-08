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
    const isMiddleButton = e.evt.button === 1;

    // Pan with middle mouse button from anywhere, or left-click on empty space
    if (isMiddleButton || (isEmptySpace && activeTool === 'select' && !isRecording)) {
      if (isMiddleButton) e.evt.preventDefault();
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
    const isEmptySpace = target === target.getStage() || target.attrs.id === 'bg-rect' || target.attrs.id?.startsWith('grid-');
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
    <div ref={containerRef} className="flex-1 bg-canvas-bg tactical-grid overflow-hidden relative" onContextMenu={(e) => e.preventDefault()} onMouseDown={(e) => { if (e.button === 1) e.preventDefault(); }}>
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
            const isGroupSelected = isSelected && selectedIds.length > 1;
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

                {/* Crack overlay: realistic fracture lines */}
                {hasCrack && (() => {
                  const s2 = size / 2;
                  const crackEffect = unitEffects.find((e) => e.type === 'crack');
                  const crackOpacity = crackEffect ? Math.min(1, crackEffect.ended ? 0.85 : crackEffect.progress * 1.5) : 0.85;
                  return (
                    <>
                      {/* Main fracture from impact point */}
                      <Line points={[-2, -s2 * 0.3, -1, -s2 * 0.1, 3, s2 * 0.15, 1, s2 * 0.5]} stroke="#aaa" strokeWidth={2.5} opacity={crackOpacity} lineCap="round" lineJoin="round" listening={false} />
                      {/* Branch cracks */}
                      <Line points={[-1, -s2 * 0.1, -s2 * 0.4, -s2 * 0.25]} stroke="#999" strokeWidth={1.5} opacity={crackOpacity * 0.8} lineCap="round" listening={false} />
                      <Line points={[-1, -s2 * 0.1, s2 * 0.35, -s2 * 0.05]} stroke="#888" strokeWidth={1.2} opacity={crackOpacity * 0.7} lineCap="round" listening={false} />
                      <Line points={[3, s2 * 0.15, s2 * 0.45, s2 * 0.35]} stroke="#999" strokeWidth={1.5} opacity={crackOpacity * 0.75} lineCap="round" listening={false} />
                      <Line points={[3, s2 * 0.15, -s2 * 0.3, s2 * 0.4]} stroke="#888" strokeWidth={1} opacity={crackOpacity * 0.65} lineCap="round" listening={false} />
                      {/* Micro fragments */}
                      <Line points={[-s2 * 0.4, -s2 * 0.25, -s2 * 0.55, -s2 * 0.45]} stroke="#777" strokeWidth={0.8} opacity={crackOpacity * 0.5} lineCap="round" listening={false} />
                      <Line points={[s2 * 0.35, -s2 * 0.05, s2 * 0.5, -s2 * 0.2]} stroke="#777" strokeWidth={0.8} opacity={crackOpacity * 0.5} lineCap="round" listening={false} />
                    </>
                  );
                })()}

                {/* Blood overlay: realistic splatter drops */}
                {hasBlood && (() => {
                  const bloodEffect = unitEffects.find((e) => e.type === 'blood');
                  const bloodOpacity = bloodEffect ? Math.min(1, bloodEffect.ended ? 0.75 : bloodEffect.progress * 1.8) : 0.75;
                  const s2 = size / 2;
                  return (
                    <>
                      {/* Main splatter - irregular shape via multiple overlapping */}
                      <Circle x={-3} y={1} radius={s2 * 0.22} fill="#8b0000" opacity={bloodOpacity * 0.7} listening={false} />
                      <Circle x={1} y={-2} radius={s2 * 0.15} fill="#a00000" opacity={bloodOpacity * 0.6} listening={false} />
                      {/* Drip drops trailing down */}
                      <Circle x={-6} y={s2 * 0.35} radius={2.5} fill="#8b0000" opacity={bloodOpacity * 0.65} listening={false} />
                      <Circle x={-5} y={s2 * 0.55} radius={1.8} fill="#700000" opacity={bloodOpacity * 0.55} listening={false} />
                      <Circle x={-4.5} y={s2 * 0.7} radius={1.2} fill="#600000" opacity={bloodOpacity * 0.45} listening={false} />
                      {/* Scatter drops */}
                      <Circle x={s2 * 0.3} y={-s2 * 0.15} radius={2} fill="#a00000" opacity={bloodOpacity * 0.5} listening={false} />
                      <Circle x={-s2 * 0.35} y={s2 * 0.1} radius={1.5} fill="#900000" opacity={bloodOpacity * 0.45} listening={false} />
                      <Circle x={s2 * 0.15} y={s2 * 0.3} radius={2.2} fill="#800000" opacity={bloodOpacity * 0.55} listening={false} />
                      <Circle x={s2 * 0.4} y={s2 * 0.05} radius={1} fill="#a00000" opacity={bloodOpacity * 0.4} listening={false} />
                    </>
                  );
                })()}

                {/* Explosion burst: radial shockwave + debris */}
                {hasExplosion && explosionEffect && (() => {
                  const p = explosionEffect.progress;
                  const intensity = explosionEffect.intensity;
                  return (
                    <>
                      {/* Core flash */}
                      <Circle x={0} y={0} radius={size * 0.4 * (1 - p * 0.5)} fill="#fff8e0" opacity={(1 - p) * intensity * 0.9} listening={false} />
                      {/* Inner fireball */}
                      <Circle x={0} y={0} radius={size * 0.35 * (0.5 + p * 0.5)} fill="#ff8800" opacity={(1 - p * 0.8) * intensity * 0.7} listening={false} />
                      {/* Shockwave ring */}
                      <Circle x={0} y={0} radius={size * (0.3 + p * 0.8)} stroke="#ff6600" strokeWidth={3 * (1 - p)} fill="transparent" opacity={(1 - p) * intensity * 0.6} listening={false} />
                      {/* Debris particles flying outward */}
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                        const rad = (angle * Math.PI) / 180;
                        const dist = size * (0.2 + p * 0.9) * (0.7 + (i % 3) * 0.15);
                        const pSize = (3 - p * 2) * (i % 2 === 0 ? 1 : 0.6);
                        return (
                          <Circle
                            key={`exp-${i}`}
                            x={Math.cos(rad) * dist}
                            y={Math.sin(rad) * dist}
                            radius={Math.max(0.5, pSize)}
                            fill={i % 3 === 0 ? '#ffcc00' : i % 3 === 1 ? '#ff6600' : '#ff2200'}
                            opacity={(1 - p) * intensity}
                            listening={false}
                          />
                        );
                      })}
                    </>
                  );
                })()}

                {/* Smoke: layered rising puffs with turbulence */}
                {hasSmoke && smokeEffect && (() => {
                  const p = smokeEffect.progress;
                  const intensity = smokeEffect.intensity;
                  const puffs = [
                    { x: 0, y: 0, r: 12, delay: 0 },
                    { x: -7, y: -4, r: 9, delay: 0.1 },
                    { x: 6, y: -3, r: 10, delay: 0.15 },
                    { x: -3, y: -10, r: 11, delay: 0.25 },
                    { x: 4, y: -14, r: 8, delay: 0.3 },
                    { x: -1, y: -20, r: 13, delay: 0.4 },
                    { x: 5, y: -26, r: 10, delay: 0.5 },
                  ];
                  return (
                    <>
                      {puffs.map((puff, i) => {
                        const localP = Math.max(0, Math.min(1, (p - puff.delay) / (1 - puff.delay)));
                        if (localP <= 0) return null;
                        const turbX = Math.sin(currentTime * 0.008 + i * 1.5) * 4 * localP;
                        const riseY = puff.y - localP * 25;
                        const expandR = puff.r * (0.6 + localP * 0.8);
                        const fadeOpacity = (1 - localP * 0.7) * intensity * 0.45;
                        return (
                          <Circle
                            key={`smoke-${i}`}
                            x={puff.x + turbX}
                            y={riseY - size / 2}
                            radius={expandR}
                            fill={`rgb(${120 + i * 10}, ${120 + i * 10}, ${120 + i * 10})`}
                            opacity={fadeOpacity}
                            listening={false}
                          />
                        );
                      })}
                    </>
                  );
                })()}

                {/* Fire: dynamic flickering flames */}
                {hasFire && fireEffect && (() => {
                  const intensity = fireEffect.intensity;
                  const flames = [
                    { x: 0, baseY: -size / 2, r: 7, speed: 0.025, color: '#ff2200' },
                    { x: -6, baseY: -size / 2 + 2, r: 5, speed: 0.03, color: '#ff4400' },
                    { x: 5, baseY: -size / 2 + 1, r: 6, speed: 0.022, color: '#ff6600' },
                    { x: -3, baseY: -size / 2 - 4, r: 4, speed: 0.035, color: '#ffaa00' },
                    { x: 3, baseY: -size / 2 - 6, r: 5, speed: 0.028, color: '#ff8800' },
                    { x: 0, baseY: -size / 2 - 10, r: 3, speed: 0.04, color: '#ffcc44' },
                  ];
                  return (
                    <>
                      {/* Base glow */}
                      <Circle x={0} y={-size / 2} radius={size * 0.35} fill="#ff440033" opacity={intensity * 0.3} listening={false} />
                      {flames.map((f, i) => {
                        const flicker = Math.sin(currentTime * f.speed + i * 2.1) * 3;
                        const yFlicker = Math.sin(currentTime * f.speed * 1.3 + i) * 2;
                        const sizeFlicker = Math.sin(currentTime * f.speed * 0.8 + i * 0.7) * 1.5;
                        return (
                          <Circle
                            key={`fire-${i}`}
                            x={f.x + flicker}
                            y={f.baseY + yFlicker}
                            radius={f.r + sizeFlicker}
                            fill={f.color}
                            opacity={intensity * (0.5 + Math.sin(currentTime * f.speed * 1.5 + i) * 0.2)}
                            listening={false}
                          />
                        );
                      })}
                    </>
                  );
                })()}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default MapCanvas;
