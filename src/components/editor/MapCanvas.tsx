import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer, Rect, Image as KImage, Group, Text, Circle, Line, Arrow, Ring } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '@/store/editorStore';
import type { ActiveEffect, EffectType } from '@/domain/models';
import { EFFECT_PRESETS, createEffectFromPreset } from '@/domain/services/effects';
import { v4 as uuid } from 'uuid';

const UNIT_SYMBOLS: Record<string, string> = {
  infantry: '⚔', cavalry: '🐎', armor: '⬣', artillery: '💣',
  naval: '⚓', air: '✈', hq: '★', supply: '📦',
};
const UNIT_LABELS: Record<string, string> = {
  infantry: 'INF', cavalry: 'CAV', armor: 'ARM', artillery: 'ART',
  naval: 'NAV', air: 'AIR', hq: 'HQ', supply: 'SUP',
};
const UNIT_COLOR = '#d4a843';

const EFFECT_VISUAL_SYMBOLS: Record<string, string> = {
  explosion: '💥', shake: '〰️', crack: '⚡', blood: '🩸', smoke: '💨', fire: '🔥', gunshot: '🔫',
};

const EFFECT_COLORS: Record<string, string> = {
  explosion: '#ff6600', shake: '#ffaa00', crack: '#888888', blood: '#cc0000', smoke: '#9e9e9e', fire: '#ff4400', gunshot: '#ffdd00',
};

const customIconCache = new Map<string, HTMLImageElement>();

function useCustomIconCache(sources: string[]) {
  const [, forceRerender] = useState(0);
  useEffect(() => {
    let cancelled = false;
    sources.forEach((src) => {
      if (!src || customIconCache.has(src)) return;
      const image = new window.Image();
      image.src = src;
      image.onload = () => { customIconCache.set(src, image); if (!cancelled) forceRerender((v) => v + 1); };
    });
    return () => { cancelled = true; };
  }, [sources]);
  return customIconCache;
}

function getShakeOffset(effects: ActiveEffect[], time: number): { dx: number; dy: number } {
  let dx = 0, dy = 0;
  for (const eff of effects) {
    if ((eff.type === 'shake' || eff.type === 'explosion') && !eff.ended) {
      const amplitude = eff.intensity * 8;
      const decay = 1 - eff.progress;
      dx += Math.sin(time * 4.0 + Math.sin(time * 0.7) * 3) * amplitude * decay;
      dy += Math.cos(time * 5.3 + Math.cos(time * 0.9) * 2) * amplitude * decay;
    }
  }
  return { dx, dy };
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const MapCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const lastDragPos = useRef<{ x: number; y: number } | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef<{ x: number; y: number; stageX: number; stageY: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objectId: string } | null>(null);

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
  const addObject = useEditorStore((s) => s.addObject);
  const addEffect = useEditorStore((s) => s.addEffect);
  const addToGroup = useEditorStore((s) => s.addToGroup);

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

  // Close context menu on click elsewhere
  useEffect(() => {
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

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

  // Middle-button panning only
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
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning.current || !panStart.current) return;
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition()!;
    const dx = pointer.x - panStart.current.x;
    const dy = pointer.y - panStart.current.y;
    setStagePosition({ x: panStart.current.stageX + dx, y: panStart.current.stageY + dy });
  };

  const handleStageMouseUp = () => {
    if (isPanning.current) {
      isPanning.current = false;
      panStart.current = null;
      const stage = stageRef.current;
      if (stage) stage.container().style.cursor = 'default';
    }
  };

  // Left-click on empty space = deselect everything
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    if (isPanning.current) return;
    const target = e.target;
    const stage = stageRef.current;
    // Click hit the Stage itself, the bg rect, or passed through non-listening grid lines
    const isEmptySpace = target === stage || target.attrs?.id === 'bg-rect';
    if (isEmptySpace) {
      // Clear ALL selections: units, narrations, overlays
      useEditorStore.setState({
        selectedIds: [],
        selectedNarrationId: null,
        selectedOverlayId: null,
      });
      setContextMenu(null);
    }
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
    if (isPlaying && derivedTransforms[id]) return derivedTransforms[id];
    return null;
  };

  // Drag-and-drop handler for effects from sidebar
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const effectData = e.dataTransfer.getData('application/effect-preset');
    if (!effectData) return;
    const presetIndex = parseInt(effectData, 10);
    if (isNaN(presetIndex)) return;
    const preset = EFFECT_PRESETS[presetIndex];
    if (!preset) return;

    const stage = stageRef.current;
    if (!stage) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const stageX = (e.clientX - rect.left - stagePosition.x) / stageScale;
    const stageY = (e.clientY - rect.top - stagePosition.y) / stageScale;

    const hitUnit = objectOrder.map((id) => objectsById[id]).filter((o) => o?.type === 'unit').find((u) => {
      const s = (u.width || 50) / 2;
      return Math.abs(stageX - u.x) < s && Math.abs(stageY - u.y) < s;
    });

    if (hitUnit) {
      const effect = createEffectFromPreset(preset, useEditorStore.getState().currentTime);
      addEffect(hitUnit.id, effect);
      setSelectedIds([hitUnit.id]);
    } else {
      const obj = {
        id: uuid(),
        type: 'effect' as const,
        effectType: preset.type,
        label: preset.label,
        x: stageX,
        y: stageY,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        layer: 'effects' as const,
        visible: true,
        locked: false,
        width: 60,
        height: 60,
      };
      addObject(obj);
      const effect = createEffectFromPreset(preset, useEditorStore.getState().currentTime);
      addEffect(obj.id, effect);
      setSelectedIds([obj.id]);
    }
  }, [stagePosition, stageScale, objectOrder, objectsById, addEffect, addObject, setSelectedIds]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }, []);

  // Right-click handler
  const handleObjectContextMenu = (id: string, e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    const stage = stageRef.current;
    if (!stage) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setContextMenu({
      x: e.evt.clientX - rect.left,
      y: e.evt.clientY - rect.top,
      objectId: id,
    });
  };

  const getGroupForObject = (objId: string) => {
    for (const group of Object.values(groups)) {
      if (group.memberIds.includes(objId)) return group;
    }
    return null;
  };

  const highlightedGroupMemberIds = new Set<string>();
  let highlightGroupColor = '';
  for (const sid of selectedIds) {
    const g = getGroupForObject(sid);
    if (g) {
      g.memberIds.forEach((m) => highlightedGroupMemberIds.add(m));
      highlightGroupColor = g.color;
    }
  }

  const units = objectOrder.map((id) => objectsById[id]).filter((o) => o && (o.type === 'unit' || o.type === 'effect'));
  const customIconSources = units.map((unit) => unit.customIcon).filter((src): src is string => Boolean(src));
  const customIconImages = useCustomIconCache(customIconSources);
  const arrows = objectOrder.map((id) => objectsById[id]).filter((o) => o && o.type === 'drawing' && o.drawTool === 'arrow');

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-canvas-bg tactical-grid overflow-hidden relative"
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

            const customIconImage = unit.customIcon ? customIconImages.get(unit.customIcon) : null;
            const hasCustomIcon = Boolean(customIconImage);
            const isStandaloneEffect = unit.type === 'effect';

            const unitEffects = derivedEffects[unit.id] || [];
            const shakeOffset = getShakeOffset(unitEffects, currentTime);
            const hasCrack = unitEffects.some((e) => e.type === 'crack');
            const hasBlood = unitEffects.some((e) => e.type === 'blood');
            const hasExplosion = unitEffects.some((e) => e.type === 'explosion' && !e.ended);
            const hasSmoke = unitEffects.some((e) => e.type === 'smoke' && !e.ended);
            const hasFire = unitEffects.some((e) => e.type === 'fire' && !e.ended);
            const hasGunshot = unitEffects.some((e) => e.type === 'gunshot' && !e.ended);
            const explosionEffect = unitEffects.find((e) => e.type === 'explosion' && !e.ended);
            const smokeEffect = unitEffects.find((e) => e.type === 'smoke' && !e.ended);
            const fireEffect = unitEffects.find((e) => e.type === 'fire' && !e.ended);
            const gunshotEffect = unitEffects.find((e) => e.type === 'gunshot' && !e.ended);

            const group = getGroupForObject(unit.id);

            // Get static effects for standalone effect label & effect badge on units
            const staticEffects = activeScene.effectsByObjectId[unit.id] || [];

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
                onContextMenu={(e) => handleObjectContextMenu(unit.id, e)}
                onDragStart={(e) => handleDragStart(unit.id, e)}
                onDragMove={(e) => handleDragMove(unit.id, e)}
                onDragEnd={(e) => handleDragEnd(unit.id, e)}
              >
                {/* Group highlight ring */}
                {isGroupHighlighted && (
                  <Rect x={-size / 2 - 6} y={-size / 2 - 6} width={size + 12} height={size + 12} stroke={highlightGroupColor} strokeWidth={2} dash={[4, 3]} cornerRadius={6} opacity={0.7} listening={false} />
                )}

                {/* Selection ring */}
                {isSelected && (
                  <Rect x={-size / 2 - 4} y={-size / 2 - 4} width={size + 8} height={size + 8} stroke={group ? group.color : UNIT_COLOR} strokeWidth={2} dash={selectedIds.length > 1 ? [6, 3] : [4, 4]} cornerRadius={4} />
                )}

                {/* Unit body - only for non-standalone effects */}
                {!isStandaloneEffect && (
                  <>
                    <Rect x={-size / 2} y={-size / 2} width={size} height={size} fill={`${UNIT_COLOR}44`} stroke={UNIT_COLOR} strokeWidth={2} cornerRadius={4} />
                    {hasCustomIcon && <KImage image={customIconImage!} x={-size / 2 + 4} y={-size / 2 + 4} width={size - 8} height={size - 8} />}
                    {!hasCustomIcon && (
                      <>
                        <Text x={-size / 2} y={-size / 2 + 4} width={size} text={UNIT_SYMBOLS[unit.unitType || 'infantry'] || '?'} fontSize={size * 0.4} align="center" fill={UNIT_COLOR} />
                        <Text x={-size / 2} y={size / 2 - 14} width={size} text={UNIT_LABELS[unit.unitType || 'infantry'] || '?'} fontSize={9} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={UNIT_COLOR} align="center" />
                      </>
                    )}
                    <Circle x={size / 2 - 4} y={-size / 2 + 4} radius={4} fill={UNIT_COLOR} />
                    {/* Group badge */}
                    {group && (
                      <>
                        <Circle x={-size / 2 + 4} y={-size / 2 + 4} radius={5} fill={group.color} opacity={0.9} listening={false} />
                        <Text x={-size / 2 + 1} y={-size / 2 + 0.5} text={group.name.charAt(0).toUpperCase()} fontSize={7} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill="#fff" width={7} align="center" listening={false} />
                      </>
                    )}
                    {/* Effect indicator badges on units (always visible) */}
                    {staticEffects.length > 0 && (
                      <>
                        {staticEffects.slice(0, 3).map((eff, i) => {
                          const effColor = EFFECT_COLORS[eff.type] || '#ff6600';
                          return (
                            <React.Fragment key={eff.id}>
                              <Circle x={size / 2 - 4 - i * 9} y={size / 2 - 4} radius={4} fill={effColor} opacity={0.85} listening={false} />
                              <Text x={size / 2 - 7 - i * 9} y={size / 2 - 8} text={EFFECT_VISUAL_SYMBOLS[eff.type] || '?'} fontSize={6} listening={false} />
                            </React.Fragment>
                          );
                        })}
                        {staticEffects.length > 3 && (
                          <Text x={size / 2 - 4 - 3 * 9} y={size / 2 - 7} text={`+${staticEffects.length - 3}`} fontSize={6} fontFamily="JetBrains Mono, monospace" fill="#fff" listening={false} />
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Standalone effect placeholder - improved visuals */}
                {isStandaloneEffect && (
                  <>
                    <Circle x={0} y={0} radius={size * 0.4} fill={(EFFECT_COLORS[unit.effectType || ''] || '#ff6600') + '15'} stroke={(EFFECT_COLORS[unit.effectType || ''] || '#ff6600') + '66'} strokeWidth={1.5} dash={[4, 3]} listening={true} />
                    <Text x={-size / 2} y={-8} width={size} text={EFFECT_VISUAL_SYMBOLS[unit.effectType || ''] || '💥'} fontSize={16} align="center" listening={false} />
                    <Text x={-size / 2} y={10} width={size} text={unit.label || unit.effectType || 'FX'} fontSize={8} fontFamily="JetBrains Mono, monospace" fontStyle="bold" fill={EFFECT_COLORS[unit.effectType || ''] || '#ff8844'} align="center" listening={false} />
                    {/* Show timing info */}
                    {staticEffects.length > 0 && (
                      <Text x={-size / 2} y={20} width={size} text={`${(staticEffects[0].startTime / 1000).toFixed(1)}s`} fontSize={7} fontFamily="JetBrains Mono, monospace" fill={(EFFECT_COLORS[unit.effectType || ''] || '#ff8844') + '88'} align="center" listening={false} />
                    )}
                  </>
                )}

                {/* === EFFECT OVERLAYS === */}
                {hasCrack && (() => {
                  const s2 = size / 2;
                  const ce = unitEffects.find((e) => e.type === 'crack');
                  const op = ce ? Math.min(1, ce.ended ? 0.9 : ce.progress * 2) : 0.9;
                  const cracks: { points: number[]; w: number; shade: string }[] = [
                    { points: [0, -s2*0.1, -2, 0, 1, s2*0.2, -1, s2*0.55], w: 2.2, shade: '#888' },
                    { points: [-2, 0, -s2*0.35, -s2*0.15, -s2*0.5, -s2*0.3], w: 1.5, shade: '#999' },
                    { points: [-2, 0, s2*0.25, -s2*0.1, s2*0.45, -s2*0.25], w: 1.3, shade: '#aaa' },
                    { points: [1, s2*0.2, s2*0.3, s2*0.35, s2*0.5, s2*0.28], w: 1.4, shade: '#999' },
                    { points: [1, s2*0.2, -s2*0.2, s2*0.4, -s2*0.35, s2*0.55], w: 1.1, shade: '#aaa' },
                    { points: [-s2*0.35, -s2*0.15, -s2*0.55, -s2*0.4], w: 0.7, shade: '#777' },
                    { points: [s2*0.45, -s2*0.25, s2*0.55, -s2*0.45], w: 0.6, shade: '#777' },
                    { points: [0, -s2*0.1, s2*0.1, -s2*0.35, s2*0.2, -s2*0.55], w: 1.0, shade: '#bbb' },
                  ];
                  return (
                    <>
                      {cracks.slice(0, 5).map((c, i) => (
                        <Line key={`cs-${i}`} points={c.points.map((p, j) => p + (j % 2 === 0 ? 0.8 : 0.8))} stroke="#00000066" strokeWidth={c.w + 1} opacity={op * 0.4} lineCap="round" lineJoin="round" listening={false} />
                      ))}
                      {cracks.map((c, i) => (
                        <Line key={`c-${i}`} points={c.points} stroke={c.shade} strokeWidth={c.w} opacity={op * (1 - i * 0.05)} lineCap="round" lineJoin="round" listening={false} />
                      ))}
                      <Line points={[0, -s2*0.1, -2, 0, 1, s2*0.2]} stroke="#ffffff44" strokeWidth={0.5} opacity={op * 0.3} lineCap="round" listening={false} />
                    </>
                  );
                })()}

                {hasBlood && (() => {
                  const be = unitEffects.find((e) => e.type === 'blood');
                  const op = be ? Math.min(1, be.ended ? 0.8 : be.progress * 2) : 0.8;
                  const s2 = size / 2;
                  const splatters = [
                    { x: -1, y: 2, r: s2 * 0.25, color: '#8b0000' },
                    { x: 3, y: -3, r: s2 * 0.18, color: '#a00000' },
                    { x: -4, y: -1, r: s2 * 0.12, color: '#700000' },
                    { x: 5, y: 4, r: s2 * 0.1, color: '#900000' },
                    { x: -3, y: 6, r: s2 * 0.08, color: '#800000' },
                  ];
                  const drips = [
                    { x: -2, sy: s2 * 0.2, ey: s2 * 0.7, w: 2.5 },
                    { x: 3, sy: s2 * 0.1, ey: s2 * 0.55, w: 2 },
                    { x: -5, sy: s2 * 0.05, ey: s2 * 0.45, w: 1.5 },
                  ];
                  return (
                    <>
                      <Circle x={0} y={2} radius={s2 * 0.3} fill="#4a000033" opacity={op * 0.5} listening={false} />
                      {splatters.map((sp, i) => (
                        <React.Fragment key={`bl-${i}`}>
                          <Circle x={sp.x} y={sp.y} radius={sp.r} fill={sp.color} opacity={op * (0.7 - i * 0.05)} listening={false} />
                          <Circle x={sp.x + sp.r * 0.3} y={sp.y - sp.r * 0.2} radius={sp.r * 0.6} fill={sp.color} opacity={op * 0.5} listening={false} />
                          <Circle x={sp.x - sp.r * 0.25} y={sp.y + sp.r * 0.35} radius={sp.r * 0.5} fill={sp.color} opacity={op * 0.45} listening={false} />
                        </React.Fragment>
                      ))}
                      {drips.map((d, i) => (
                        <React.Fragment key={`bd-${i}`}>
                          <Line points={[d.x, d.sy, d.x - 0.5, (d.sy + d.ey) / 2, d.x + 0.3, d.ey]} stroke="#8b0000" strokeWidth={d.w} opacity={op * 0.6} lineCap="round" tension={0.4} listening={false} />
                          <Circle x={d.x + 0.3} y={d.ey + 2} radius={d.w * 0.8} fill="#700000" opacity={op * 0.5} listening={false} />
                        </React.Fragment>
                      ))}
                      <Circle x={-1} y={1} radius={s2 * 0.08} fill="#ff4444" opacity={op * 0.2} listening={false} />
                    </>
                  );
                })()}

                {hasExplosion && explosionEffect && (() => {
                  const p = explosionEffect.progress;
                  const intensity = explosionEffect.intensity;
                  const fadeOut = Math.max(0, 1 - p * 1.2);
                  return (
                    <>
                      <Circle x={0} y={0} radius={size * (0.4 + p * 1.2)} stroke="#ff880044" strokeWidth={4 * fadeOut} fill="transparent" opacity={fadeOut * intensity * 0.5} listening={false} />
                      <Circle x={0} y={0} radius={size * (0.2 + p * 0.9)} stroke="#ff660033" strokeWidth={2 * fadeOut} fill="transparent" opacity={fadeOut * intensity * 0.4} listening={false} />
                      <Circle x={0} y={0} radius={size * 0.35 * (1 - p * 0.6)} fill="#fffbe8" opacity={fadeOut * intensity * 0.95} listening={false} />
                      <Circle x={0} y={0} radius={size * 0.45 * (0.5 + p * 0.5)} fill="#ff6600" opacity={fadeOut * intensity * 0.65} listening={false} />
                      <Circle x={0} y={0} radius={size * 0.55 * (0.3 + p * 0.7)} fill="#cc220088" opacity={fadeOut * intensity * 0.45} listening={false} />
                      <Circle x={0} y={-size * p * 0.3} radius={size * (0.2 + p * 0.6)} fill="#44444488" opacity={p * intensity * 0.35} listening={false} />
                      {Array.from({ length: 12 }, (_, i) => {
                        const angle = (i * 30 + seededRandom(i) * 20) * Math.PI / 180;
                        const speed = 0.7 + seededRandom(i + 50) * 0.6;
                        const dist = size * (0.15 + p * speed);
                        const pSize = Math.max(0.5, (2.5 - p * 2) * (seededRandom(i + 100) * 0.5 + 0.5));
                        const dx = Math.cos(angle) * dist;
                        const dy = Math.sin(angle) * dist;
                        const colors = ['#ffcc00', '#ff8800', '#ff4400', '#ff2200'];
                        return (
                          <React.Fragment key={`exp-${i}`}>
                            <Line points={[dx * 0.3, dy * 0.3, dx, dy]} stroke={colors[i % 4]} strokeWidth={1} opacity={fadeOut * intensity * 0.4} lineCap="round" listening={false} />
                            <Circle x={dx} y={dy} radius={pSize} fill={colors[i % 4]} opacity={fadeOut * intensity * 0.8} listening={false} />
                          </React.Fragment>
                        );
                      })}
                    </>
                  );
                })()}

                {hasSmoke && smokeEffect && (() => {
                  const p = smokeEffect.progress;
                  const intensity = smokeEffect.intensity;
                  const puffs = [
                    { x: 0, y: 0, r: 14, delay: 0, shade: 100 },
                    { x: -8, y: -3, r: 11, delay: 0.05, shade: 110 },
                    { x: 7, y: -2, r: 12, delay: 0.08, shade: 105 },
                    { x: -4, y: -8, r: 13, delay: 0.15, shade: 115 },
                    { x: 5, y: -12, r: 10, delay: 0.2, shade: 120 },
                    { x: -2, y: -18, r: 15, delay: 0.3, shade: 130 },
                    { x: 6, y: -24, r: 12, delay: 0.35, shade: 135 },
                    { x: -5, y: -30, r: 14, delay: 0.45, shade: 140 },
                    { x: 3, y: -36, r: 10, delay: 0.55, shade: 150 },
                    { x: -1, y: -42, r: 16, delay: 0.65, shade: 155 },
                  ];
                  return (
                    <>
                      {puffs.map((puff, i) => {
                        const localP = Math.max(0, Math.min(1, (p - puff.delay) / (1 - puff.delay)));
                        if (localP <= 0) return null;
                        const turbX = Math.sin(currentTime * 0.006 + i * 1.7) * 5 * localP + Math.sin(currentTime * 0.015 + i * 3.1) * 2 * localP;
                        const turbY = Math.sin(currentTime * 0.004 + i * 2.3) * 2 * localP;
                        const riseY = puff.y - localP * 30;
                        const expandR = puff.r * (0.4 + localP * 1.0);
                        const fadeIn = Math.min(1, localP * 4);
                        const fadeFOut = Math.max(0, 1 - (localP - 0.6) / 0.4);
                        const fadeOpacity = fadeIn * fadeFOut * intensity * 0.4;
                        const g = puff.shade;
                        return (
                          <React.Fragment key={`smoke-${i}`}>
                            <Circle x={puff.x + turbX + 1} y={riseY + turbY - size / 2 + 2} radius={expandR * 1.1} fill={`rgb(${g - 30},${g - 30},${g - 30})`} opacity={fadeOpacity * 0.3} listening={false} />
                            <Circle x={puff.x + turbX} y={riseY + turbY - size / 2} radius={expandR} fill={`rgb(${g},${g},${g})`} opacity={fadeOpacity} listening={false} />
                            <Circle x={puff.x + turbX - expandR * 0.2} y={riseY + turbY - size / 2 - expandR * 0.15} radius={expandR * 0.5} fill={`rgb(${g + 25},${g + 25},${g + 25})`} opacity={fadeOpacity * 0.5} listening={false} />
                          </React.Fragment>
                        );
                      })}
                    </>
                  );
                })()}

                {hasFire && fireEffect && (() => {
                  const intensity = fireEffect.intensity;
                  const baseY = -size / 2;
                  const flames = [
                    { x: 0, y: baseY, h: 22, w: 8, speed: 0.02, color: '#ff2200', delay: 0 },
                    { x: -5, y: baseY + 2, h: 18, w: 6, speed: 0.025, color: '#ff4400', delay: 0.1 },
                    { x: 5, y: baseY + 1, h: 20, w: 7, speed: 0.022, color: '#ff3300', delay: 0.05 },
                    { x: -3, y: baseY - 2, h: 16, w: 5, speed: 0.03, color: '#ff6600', delay: 0.15 },
                    { x: 3, y: baseY - 4, h: 14, w: 5, speed: 0.028, color: '#ff8800', delay: 0.12 },
                    { x: 0, y: baseY - 8, h: 12, w: 4, speed: 0.035, color: '#ffaa00', delay: 0.2 },
                    { x: -2, y: baseY - 12, h: 10, w: 3, speed: 0.04, color: '#ffcc33', delay: 0.25 },
                    { x: 1, y: baseY - 14, h: 8, w: 3, speed: 0.045, color: '#ffdd66', delay: 0.3 },
                  ];
                  return (
                    <>
                      <Circle x={0} y={baseY + 4} radius={size * 0.45} fill="#ff440011" opacity={intensity * 0.5} listening={false} />
                      <Circle x={0} y={baseY} radius={size * 0.3} fill="#ff660022" opacity={intensity * 0.4} listening={false} />
                      {flames.map((f, i) => {
                        const flicker = Math.sin(currentTime * f.speed + i * 2.7) * 3;
                        const yFlicker = Math.sin(currentTime * f.speed * 1.4 + i * 1.3) * 2.5;
                        const hFlicker = Math.sin(currentTime * f.speed * 0.9 + i * 0.5) * 2;
                        const wFlicker = Math.sin(currentTime * f.speed * 1.1 + i * 1.8) * 1;
                        const fx = f.x + flicker;
                        const fy = f.y + yFlicker;
                        const fh = f.h + hFlicker;
                        const fw = f.w + wFlicker;
                        const flickerOpacity = 0.5 + Math.sin(currentTime * f.speed * 1.6 + i * 0.9) * 0.15;
                        return (
                          <React.Fragment key={`fire-${i}`}>
                            <Circle x={fx} y={fy - fh * 0.3} radius={fw * 1.5} fill={f.color + '22'} opacity={intensity * flickerOpacity * 0.3} listening={false} />
                            <Circle x={fx} y={fy - fh * 0.5} radius={fw} fill={f.color} opacity={intensity * flickerOpacity} listening={false} />
                            <Circle x={fx} y={fy - fh * 0.3} radius={fw * 0.8} fill={f.color} opacity={intensity * flickerOpacity * 0.9} listening={false} />
                            <Circle x={fx} y={fy} radius={fw * 0.6} fill={f.color} opacity={intensity * flickerOpacity * 0.7} listening={false} />
                          </React.Fragment>
                        );
                      })}
                      <Circle x={0} y={baseY + 2} radius={4} fill="#fff8e0" opacity={intensity * 0.6} listening={false} />
                      {[0, 1, 2, 3].map((i) => {
                        const emberY = baseY - 20 - Math.sin(currentTime * 0.01 + i * 2) * 15;
                        const emberX = Math.sin(currentTime * 0.008 + i * 3) * 8;
                        return (
                          <Circle key={`ember-${i}`} x={emberX} y={emberY} radius={1.2} fill="#ffcc00" opacity={intensity * 0.4 * (0.5 + Math.sin(currentTime * 0.02 + i) * 0.5)} listening={false} />
                        );
                      })}
                    </>
                  );
                })()}

                {/* Gunshot / Musket muzzle flash */}
                {hasGunshot && gunshotEffect && (() => {
                  const p = gunshotEffect.progress;
                  const intensity = gunshotEffect.intensity;
                  const fadeOut = Math.max(0, 1 - p * 2);
                  const flashSize = size * 0.5 * (1 - p * 0.5);
                  const smokeP = Math.max(0, (p - 0.3) / 0.7);
                  return (
                    <>
                      {/* Muzzle flash - bright burst */}
                      <Circle x={size / 2 + 8} y={0} radius={flashSize} fill="#fffbe0" opacity={fadeOut * intensity * 0.95} listening={false} />
                      <Circle x={size / 2 + 12} y={0} radius={flashSize * 0.7} fill="#ffdd00" opacity={fadeOut * intensity * 0.8} listening={false} />
                      <Circle x={size / 2 + 6} y={0} radius={flashSize * 1.3} fill="#ff880044" opacity={fadeOut * intensity * 0.5} listening={false} />
                      {/* Flash rays */}
                      {[0, 30, -30, 15, -15].map((angle, i) => {
                        const rad = (angle * Math.PI) / 180;
                        const len = size * 0.6 * fadeOut;
                        return (
                          <Line key={`flash-${i}`} points={[size / 2 + 8, 0, size / 2 + 8 + Math.cos(rad) * len, Math.sin(rad) * len]} stroke="#ffdd00" strokeWidth={1.5 - i * 0.2} opacity={fadeOut * intensity * 0.6} lineCap="round" listening={false} />
                        );
                      })}
                      {/* Small smoke puff after flash */}
                      {smokeP > 0 && (
                        <>
                          <Circle x={size / 2 + 15 + smokeP * 10} y={-smokeP * 5} radius={4 + smokeP * 8} fill="#aaaaaa" opacity={intensity * 0.3 * (1 - smokeP)} listening={false} />
                          <Circle x={size / 2 + 12 + smokeP * 6} y={-smokeP * 3} radius={3 + smokeP * 5} fill="#cccccc" opacity={intensity * 0.2 * (1 - smokeP)} listening={false} />
                        </>
                      )}
                    </>
                  );
                })()}
              </Group>
            );
          })}
        </Layer>
      </Stage>

      {/* HTML context menu for right-click on objects */}
      {contextMenu && (
        <div
          className="absolute z-50 bg-panel border border-border rounded shadow-lg py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {Object.values(groups).length > 0 && (
            <>
              <div className="px-3 py-1 text-[8px] font-mono uppercase text-muted-foreground">Add to Group</div>
              {Object.values(groups).map((g) => (
                <button
                  key={g.id}
                  onClick={() => { addToGroup(g.id, [contextMenu.objectId]); setContextMenu(null); }}
                  className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  {g.name}
                </button>
              ))}
              <div className="h-px bg-border my-1" />
            </>
          )}
          <button
            onClick={() => { setSelectedIds([contextMenu.objectId]); setContextMenu(null); }}
            className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-foreground hover:bg-muted transition-colors"
          >
            Select
          </button>
          {getGroupForObject(contextMenu.objectId) && (
            <button
              onClick={() => {
                const g = getGroupForObject(contextMenu.objectId);
                if (g) {
                  useEditorStore.getState().removeFromGroup(g.id, [contextMenu.objectId]);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-foreground hover:bg-muted transition-colors"
            >
              Remove from Group
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MapCanvas;
