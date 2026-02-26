import React, { useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KImage, Group, Text, Circle, Line } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '@/store/editorStore';
import type { MapObject } from '@/types/editor';

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

const MapCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dims, setDims] = React.useState({ width: 800, height: 600 });
  const [bgImage, setBgImage] = React.useState<HTMLImageElement | null>(null);

  const objects = useEditorStore((s) => s.project.objects);
  const backgroundImage = useEditorStore((s) => s.project.backgroundImage);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const activeTool = useEditorStore((s) => s.activeTool);
  const stageScale = useEditorStore((s) => s.stageScale);
  const stagePosition = useEditorStore((s) => s.stagePosition);
  const isRecording = useEditorStore((s) => s.isRecording);

  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const updateObject = useEditorStore((s) => s.updateObject);
  const recordPosition = useEditorStore((s) => s.recordPosition);
  const setStageScale = useEditorStore((s) => s.setStageScale);
  const setStagePosition = useEditorStore((s) => s.setStagePosition);

  // Resize handler
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

  // Load background image
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

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const x = e.target.x();
    const y = e.target.y();
    if (isRecording) {
      recordPosition(id, x, y);
    } else {
      updateObject(id, { x, y });
    }
  };

  const units = objects.filter((o) => o.type === 'unit');
  const drawings = objects.filter((o) => o.type === 'drawing');

  return (
    <div ref={containerRef} className="flex-1 bg-canvas-bg tactical-grid overflow-hidden relative">
      {/* Coordinates overlay */}
      <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-panel/90 border border-border rounded text-[10px] font-mono text-muted-foreground">
        {Math.round(stageScale * 100)}% | {objects.length} objects
      </div>

      {/* Recording indicator */}
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
        draggable={activeTool === 'select' && !isRecording}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        {/* Background Layer */}
        <Layer>
          <Rect id="bg-rect" x={0} y={0} width={1920} height={1080} fill="#0d1117" />
          {bgImage && <KImage image={bgImage} x={0} y={0} width={1920} height={1080} />}
          {Array.from({ length: 97 }, (_, i) => (
            <Line key={`vg-${i}`} points={[i * 20, 0, i * 20, 1080]} stroke="#1a2332" strokeWidth={0.5} />
          ))}
          {Array.from({ length: 55 }, (_, i) => (
            <Line key={`hg-${i}`} points={[0, i * 20, 1920, i * 20]} stroke="#1a2332" strokeWidth={0.5} />
          ))}
        </Layer>

        {/* Drawings Layer */}
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

        {/* Units Layer */}
        <Layer>
          {units.map((unit) => {
            const isSelected = selectedIds.includes(unit.id);
            const size = unit.width || 50;

            return (
              <Group
                key={unit.id}
                x={unit.x}
                y={unit.y}
                rotation={unit.rotation}
                scaleX={unit.scaleX}
                scaleY={unit.scaleY}
                draggable={(activeTool === 'select' || isRecording) && !unit.locked}
                onClick={(e) => {
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
                {/* Unit label */}
                <Text
                  x={-size / 2}
                  y={-6}
                  width={size}
                  text={UNIT_LABELS[unit.unitType || 'infantry'] || '?'}
                  fontSize={13}
                  fontFamily="JetBrains Mono, monospace"
                  fontStyle="bold"
                  fill={UNIT_COLOR}
                  align="center"
                />
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
