import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Play, Pause, SkipBack, SkipForward, Plus, Trash2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { NarrationEvent, OverlayEvent } from '@/domain/models';
import { EFFECT_PRESETS } from '@/domain/services/effects';

const TimelinePanel: React.FC = () => {
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const seekTo = useEditorStore((s) => s.seekTo);
  const computeDerivedTransforms = useEditorStore((s) => s.computeDerivedTransforms);
  const isRecording = useEditorStore((s) => s.isRecording);
  const recordingSession = useEditorStore((s) => s.recordingSession);
  const recordDurationSeconds = useEditorStore((s) => s.recordDurationSeconds);
  const addNarration = useEditorStore((s) => s.addNarration);
  const removeNarration = useEditorStore((s) => s.removeNarration);
  const addOverlay = useEditorStore((s) => s.addOverlay);
  const removeOverlay = useEditorStore((s) => s.removeOverlay);
  const setSelectedNarrationId = useEditorStore((s) => s.setSelectedNarrationId);
  const setSelectedOverlayId = useEditorStore((s) => s.setSelectedOverlayId);
  const selectedNarrationId = useEditorStore((s) => s.selectedNarrationId);
  const selectedOverlayId = useEditorStore((s) => s.selectedOverlayId);

  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  const totalDuration = activeScene.duration;
  const timelineWidth = 800;
  const pxPerMs = timelineWidth / Math.max(totalDuration, 1);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const milli = Math.floor((ms % 1000) / 100);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${milli}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(totalDuration, x / pxPerMs));
    seekTo(time);
  };

  const totalKeyframes = Object.values(activeScene.keyframesByObjectId).reduce(
    (sum, kfs) => sum + kfs.length, 0
  );

  const playRef = React.useRef<number | null>(null);
  const playStartRef = React.useRef<{ wallTime: number; sceneTime: number }>({ wallTime: 0, sceneTime: 0 });

  React.useEffect(() => {
    if (isPlaying) {
      playStartRef.current = { wallTime: performance.now(), sceneTime: currentTime };
      const tick = (now: number) => {
        const elapsed = now - playStartRef.current.wallTime;
        const newTime = playStartRef.current.sceneTime + elapsed;
        if (newTime >= totalDuration) {
          seekTo(0);
          setIsPlaying(false);
          return;
        }
        useEditorStore.setState({ currentTime: newTime });
        computeDerivedTransforms(newTime);
        playRef.current = requestAnimationFrame(tick);
      };
      computeDerivedTransforms(currentTime);
      playRef.current = requestAnimationFrame(tick);
    }
    return () => { if (playRef.current) cancelAnimationFrame(playRef.current); };
  }, [isPlaying]);

  const units = activeScene.objectOrder
    .map((id) => activeScene.objectsById[id])
    .filter((o) => o && (o.type === 'unit' || o.type === 'effect'));

  const narrationEvents = activeScene.narrationEvents || [];
  const overlayEvents = activeScene.overlayEvents || [];
  const groups = activeScene.groups || {};

  // Collect ALL effects from all objects into a single flat list for the effects row
  const allEffects: { objectId: string; objectLabel: string; effect: typeof activeScene.effectsByObjectId[string][number] }[] = [];
  for (const unit of units) {
    const effs = activeScene.effectsByObjectId[unit.id] || [];
    for (const eff of effs) {
      allEffects.push({ objectId: unit.id, objectLabel: unit.label || unit.unitType || 'Effect', effect: eff });
    }
  }

  const handleAddNarration = () => {
    // Find end of last narration to avoid overlap
    const lastEnd = narrationEvents.reduce((max, n) => Math.max(max, n.startTime + n.duration), 0);
    const startAt = lastEnd > currentTime ? lastEnd + 100 : currentTime;
    const event: NarrationEvent = {
      id: uuid(), type: 'text', startTime: startAt, duration: 3000,
      text: 'Narration text...', position: 'bottom', fontSize: 24,
      fontStyle: 'normal', textAnimation: 'fade', textColor: '#ffffff', bgOpacity: 0.6,
    };
    addNarration(event);
  };

  const handleAddOverlay = () => {
    const lastEnd = overlayEvents.reduce((max, o) => Math.max(max, o.startTime + o.duration), 0);
    const startAt = lastEnd > currentTime ? lastEnd + 100 : currentTime;
    const event: OverlayEvent = {
      id: uuid(), startTime: startAt, duration: 4000, imageUrl: '',
      imagePosition: 'center', imageScale: 1, backgroundEffect: 'blur+dim',
      dimOpacity: 0.7, title: 'Title', subtitle: 'Subtitle',
      textPosition: 'below-image', transition: 'fade',
    };
    addOverlay(event);
  };

  /** Generic drag handler for moving/resizing timeline blocks */
  const makeBlockDragHandler = (
    type: 'move' | 'resize-left' | 'resize-right',
    updateFn: (startTime: number, duration: number) => void,
    origStart: number,
    origDur: number,
  ) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dtMs = dx / pxPerMs;
      if (type === 'move') {
        const newStart = Math.max(0, origStart + dtMs);
        updateFn(newStart, origDur);
      } else if (type === 'resize-left') {
        const newStart = Math.max(0, origStart + dtMs);
        const newDur = Math.max(100, origDur - (newStart - origStart));
        updateFn(newStart, newDur);
      } else {
        const newDur = Math.max(100, origDur + dtMs);
        updateFn(origStart, newDur);
      }
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  /** Render a timeline block with move + resize handles */
  const TimelineBlock: React.FC<{
    left: number;
    width: number;
    label: string;
    sublabel?: string;
    isSelected: boolean;
    colorClass: string;
    borderClass: string;
    onClick: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    onMoveDown: (e: React.MouseEvent) => void;
    onResizeLeft: (e: React.MouseEvent) => void;
    onResizeRight: (e: React.MouseEvent) => void;
  }> = ({ left, width, label, sublabel, isSelected, colorClass, borderClass, onClick, onDelete, onMoveDown, onResizeLeft, onResizeRight }) => (
    <div
      className={`absolute top-1 h-4 rounded-sm flex items-center px-1 group cursor-grab active:cursor-grabbing ${isSelected ? `${colorClass} border-2 ${borderClass}` : `${colorClass.replace('/40', '/20')} border ${borderClass.replace('border-', 'border-')}/40 hover:${colorClass.replace('/40', '/30')}`}`}
      style={{ left, width: Math.max(width, 24) }}
      title={sublabel ? `${label} · ${sublabel}` : label}
      onClick={onClick}
      onMouseDown={onMoveDown}
    >
      <span className="text-[7px] font-mono truncate pointer-events-none flex-1">{label}</span>
      {onDelete && (
        <button onClick={onDelete} className="ml-auto text-destructive opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"><Trash2 size={8} /></button>
      )}
      {/* Left resize */}
      <div className="absolute left-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 rounded-l-sm pointer-events-auto"
        style={{ background: 'rgba(255,255,255,0.15)' }}
        onMouseDown={(e) => { e.stopPropagation(); onResizeLeft(e); }} />
      {/* Right resize */}
      <div className="absolute right-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 rounded-r-sm pointer-events-auto"
        style={{ background: 'rgba(255,255,255,0.15)' }}
        onMouseDown={(e) => { e.stopPropagation(); onResizeRight(e); }} />
    </div>
  );

  return (
    <div className="bg-timeline border-t border-border flex flex-col h-full">
      {/* Controls bar - sticky */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0 sticky top-0 z-10 bg-timeline">
        <button onClick={() => seekTo(0)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><SkipBack size={14} /></button>
        <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors">
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={() => seekTo(totalDuration)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><SkipForward size={14} /></button>
        <span className="font-mono text-xs text-primary ml-2 amber-glow">{formatTime(currentTime)}</span>
        <span className="font-mono text-[10px] text-muted-foreground">/ {formatTime(totalDuration)}</span>
        <div className="flex-1" />
        <span className="text-[10px] font-mono text-muted-foreground">{totalKeyframes} keyframes</span>
      </div>

      {/* Timeline tracks */}
      <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-tactical px-3 py-2">
        {/* Time ruler */}
        <div className="relative h-5 mb-1 cursor-pointer" onClick={handleTimelineClick} style={{ width: timelineWidth }}>
          {isRecording && recordingSession && (
            <div className="absolute top-0 h-full bg-destructive/15 border-l border-r border-destructive/40" style={{ left: recordingSession.startTime * pxPerMs, width: recordingSession.durationMs * pxPerMs }} />
          )}
          {!isRecording && !isPlaying && (
            <div className="absolute top-0 h-full bg-primary/5 border-l border-r border-primary/20 pointer-events-none" style={{ left: currentTime * pxPerMs, width: recordDurationSeconds * 1000 * pxPerMs }} />
          )}
          {Array.from({ length: Math.ceil(totalDuration / 1000) + 1 }, (_, i) => (
            <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: i * 1000 * pxPerMs }}>
              <div className="w-px h-3 bg-border" />
              <span className="text-[8px] font-mono text-muted-foreground">{i}s</span>
            </div>
          ))}
          <div className="absolute top-0 w-0.5 h-full bg-playhead z-10" style={{ left: currentTime * pxPerMs }} />
        </div>

        {/* Narration track */}
        <div className="relative h-6 mb-0.5 rounded-sm border border-accent/30 bg-accent/5" style={{ width: timelineWidth }}>
          <span className="absolute left-1 top-0.5 text-[9px] font-mono text-accent/70 uppercase pointer-events-none flex items-center gap-1">
            📝 Narr
          </span>
          <button onClick={(e) => { e.stopPropagation(); handleAddNarration(); }}
            className="absolute right-1 top-0.5 text-accent/70 hover:text-accent transition-colors z-10"
            title="Add narration">
            <Plus size={12} />
          </button>
          {narrationEvents.map((n) => {
            const isSelected = selectedNarrationId === n.id;
            return (
              <TimelineBlock
                key={n.id}
                left={n.startTime * pxPerMs}
                width={n.duration * pxPerMs}
                label={n.text?.slice(0, 15) || '...'}
                sublabel={`${(n.duration / 1000).toFixed(1)}s`}
                isSelected={isSelected}
                colorClass="bg-accent/40"
                borderClass="border-accent"
                onClick={(e) => { e.stopPropagation(); setSelectedNarrationId(n.id); }}
                onDelete={(e) => { e.stopPropagation(); removeNarration(n.id); }}
                onMoveDown={makeBlockDragHandler('move', (st, dur) => {
                  useEditorStore.getState().updateNarration(n.id, { startTime: st, duration: dur });
                }, n.startTime, n.duration)}
                onResizeLeft={makeBlockDragHandler('resize-left', (st, dur) => {
                  useEditorStore.getState().updateNarration(n.id, { startTime: st, duration: dur });
                }, n.startTime, n.duration)}
                onResizeRight={makeBlockDragHandler('resize-right', (st, dur) => {
                  useEditorStore.getState().updateNarration(n.id, { startTime: st, duration: dur });
                }, n.startTime, n.duration)}
              />
            );
          })}
        </div>

        {/* Overlay track */}
        <div className="relative h-6 mb-0.5 rounded-sm border border-secondary/30 bg-secondary/5" style={{ width: timelineWidth }}>
          <span className="absolute left-1 top-0.5 text-[9px] font-mono text-secondary-foreground/70 uppercase pointer-events-none flex items-center gap-1">
            🖼️ Ovrl
          </span>
          <button onClick={(e) => { e.stopPropagation(); handleAddOverlay(); }}
            className="absolute right-1 top-0.5 text-secondary-foreground/70 hover:text-secondary-foreground transition-colors z-10"
            title="Add overlay">
            <Plus size={12} />
          </button>
          {overlayEvents.map((o) => {
            const isSelected = selectedOverlayId === o.id;
            return (
              <TimelineBlock
                key={o.id}
                left={o.startTime * pxPerMs}
                width={o.duration * pxPerMs}
                label={o.title || 'Overlay'}
                sublabel={`${(o.duration / 1000).toFixed(1)}s`}
                isSelected={isSelected}
                colorClass="bg-secondary/40"
                borderClass="border-secondary"
                onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(o.id); }}
                onDelete={(e) => { e.stopPropagation(); removeOverlay(o.id); }}
                onMoveDown={makeBlockDragHandler('move', (st, dur) => {
                  useEditorStore.getState().updateOverlay(o.id, { startTime: st, duration: dur });
                }, o.startTime, o.duration)}
                onResizeLeft={makeBlockDragHandler('resize-left', (st, dur) => {
                  useEditorStore.getState().updateOverlay(o.id, { startTime: st, duration: dur });
                }, o.startTime, o.duration)}
                onResizeRight={makeBlockDragHandler('resize-right', (st, dur) => {
                  useEditorStore.getState().updateOverlay(o.id, { startTime: st, duration: dur });
                }, o.startTime, o.duration)}
              />
            );
          })}
        </div>

        {/* Combined Effects track - all effects from all units stacked on one row */}
        {allEffects.length > 0 && (
          <div className="relative h-6 mb-0.5 rounded-sm border border-destructive/30 bg-destructive/5" style={{ width: timelineWidth }}>
            <span className="absolute left-1 top-0.5 text-[9px] font-mono text-destructive/70 uppercase pointer-events-none">
              💥 FX ({allEffects.length})
            </span>
            {allEffects.map(({ objectId, objectLabel, effect: eff }) => {
              const preset = EFFECT_PRESETS.find((p) => p.type === eff.type);
              const effLeft = eff.startTime * pxPerMs;
              const effWidth = Math.max(eff.duration * pxPerMs, 16);
              return (
                <div
                  key={eff.id}
                  className="absolute top-1 h-4 bg-destructive/25 border border-destructive/40 rounded-sm flex items-center justify-center cursor-grab hover:bg-destructive/35 group/eff active:cursor-grabbing"
                  style={{ left: effLeft, width: effWidth }}
                  title={`${preset?.label || eff.type} on ${objectLabel} · ${(eff.startTime / 1000).toFixed(1)}s · ${(eff.duration / 1000).toFixed(1)}s`}
                  onClick={(e) => { e.stopPropagation(); setSelectedIds([objectId]); }}
                  onMouseDown={makeBlockDragHandler('move', (st, dur) => {
                    useEditorStore.getState().updateEffect(objectId, eff.id, { startTime: st, duration: dur });
                  }, eff.startTime, eff.duration)}
                >
                  <span className="text-[7px] pointer-events-none">{preset?.icon || '?'}</span>
                  {/* Left resize handle */}
                  <div
                    className="absolute left-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover/eff:opacity-100 bg-destructive/40 rounded-l-sm"
                    onMouseDown={(me) => { me.stopPropagation(); makeBlockDragHandler('resize-left', (st, dur) => {
                      useEditorStore.getState().updateEffect(objectId, eff.id, { startTime: st, duration: dur });
                    }, eff.startTime, eff.duration)(me); }}
                  />
                  {/* Right resize handle */}
                  <div
                    className="absolute right-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover/eff:opacity-100 bg-destructive/40 rounded-r-sm"
                    onMouseDown={(me) => { me.stopPropagation(); makeBlockDragHandler('resize-right', (st, dur) => {
                      useEditorStore.getState().updateEffect(objectId, eff.id, { startTime: st, duration: dur });
                    }, eff.startTime, eff.duration)(me); }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Unit tracks - keyframes only (effects shown in combined FX row) */}
        {units.slice(0, 15).map((unit) => {
          const unitKfs = activeScene.keyframesByObjectId[unit.id] || [];
          const isSelected = selectedIds.includes(unit.id);
          const group = Object.values(groups).find((g) => g.memberIds.includes(unit.id));

          return (
            <div
              key={unit.id}
              className={`relative h-6 mb-0.5 rounded-sm border cursor-pointer ${isSelected ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'}`}
              style={{ width: timelineWidth }}
              onClick={(e) => {
                e.stopPropagation();
                if (e.shiftKey) {
                  setSelectedIds(selectedIds.includes(unit.id) ? selectedIds.filter((id) => id !== unit.id) : [...selectedIds, unit.id]);
                } else {
                  setSelectedIds([unit.id]);
                }
              }}
            >
              <span className="absolute left-1 top-0.5 text-[9px] font-mono text-muted-foreground uppercase pointer-events-none flex items-center gap-1">
                {group && <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />}
                {unit.label || unit.unitType || 'Effect'}{unitKfs.length > 0 ? ` · ${unitKfs.length}kf` : ''}
              </span>
              {unitKfs.map((kf, idx) => (
                <div key={`kf-${idx}`} className="absolute top-1 w-3 h-3 bg-keyframe rounded-full border border-primary-foreground pointer-events-none" style={{ left: kf.time * pxPerMs - 6 }} title={`t=${formatTime(kf.time)}`} />
              ))}
            </div>
          );
        })}

        {units.length === 0 && (
          <div className="text-center py-4 text-[10px] font-mono text-muted-foreground">
            Add units to see timeline tracks
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePanel;
