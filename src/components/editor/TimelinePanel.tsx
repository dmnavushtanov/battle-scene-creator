import React, { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Play, Pause, SkipBack, SkipForward, Plus, Trash2, ZoomIn, ZoomOut, Lock, Unlock, Volume2, ChevronRight, ChevronDown } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import type { NarrationEvent, OverlayEvent, SoundEvent } from '@/domain/models';
import { EFFECT_COLORS } from '@/domain/constants';
import { formatTime } from '@/domain/formatters';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const TimelinePanel: React.FC = () => {
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const seekTo = useEditorStore((s) => s.seekTo);
  const computeDerivedTransforms = useEditorStore((s) => s.computeDerivedTransforms);
  const isRecording = useEditorStore((s) => s.isRecording);
  const recordingSession = useEditorStore((s) => s.recordingSession);
  const addNarration = useEditorStore((s) => s.addNarration);
  const removeNarration = useEditorStore((s) => s.removeNarration);
  const addOverlay = useEditorStore((s) => s.addOverlay);
  const removeOverlay = useEditorStore((s) => s.removeOverlay);
  const removeSound = useEditorStore((s) => s.removeSound);
  const setSelectedNarrationId = useEditorStore((s) => s.setSelectedNarrationId);
  const setSelectedOverlayId = useEditorStore((s) => s.setSelectedOverlayId);
  const selectedNarrationId = useEditorStore((s) => s.selectedNarrationId);
  const selectedOverlayId = useEditorStore((s) => s.selectedOverlayId);
  const removeObject = useEditorStore((s) => s.removeObject);
  const removeKeyframe = useEditorStore((s) => s.removeKeyframe);
  const selectedKeyframeIndex = useEditorStore((s) => s.selectedKeyframeIndex);
  const setSelectedKeyframeIndex = useEditorStore((s) => s.setSelectedKeyframeIndex);

  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);

  const [timelineZoom, setTimelineZoom] = useState(1);
  const [timeframeLocked, setTimeframeLocked] = useState(false);
  const [deleteTrackId, setDeleteTrackId] = useState<string | null>(null);
  const [deleteTrackLabel, setDeleteTrackLabel] = useState('');
  const [expandedUnitEffects, setExpandedUnitEffects] = useState<Record<string, boolean>>({});
  const totalDuration = activeScene.duration;
  const timelineWidth = Math.max(600, 800 * timelineZoom);
  const pxPerMs = timelineWidth / Math.max(totalDuration, 1);

  const handleRulerScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const ruler = e.currentTarget;
    const rect = ruler.getBoundingClientRect();
    const calcTime = (clientX: number) => Math.max(0, Math.min(totalDuration, (clientX - rect.left) / pxPerMs));
    if (isPlaying) setIsPlaying(false);
    seekTo(calcTime(e.clientX));
    const onMove = (me: MouseEvent) => {
      const t = calcTime(me.clientX);
      seekTo(t);
      computeDerivedTransforms(t);
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
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

  const allObjects = activeScene.objectOrder
    .map((id) => activeScene.objectsById[id])
    .filter(Boolean);

  const unitObjects = allObjects.filter((o) => o.type === 'unit');
  const standaloneEffects = allObjects.filter((o) => o.type === 'effect');

  const groups = activeScene.groups || {};
  const groupList = Object.values(groups);

  const sortedUnits = React.useMemo(() => {
    const grouped: typeof unitObjects = [];
    const ungrouped: typeof unitObjects = [];
    const unitsByGroup: Record<string, typeof unitObjects> = {};

    for (const unit of unitObjects) {
      const group = groupList.find((g) => g.memberIds.includes(unit.id));
      if (group) {
        if (!unitsByGroup[group.id]) unitsByGroup[group.id] = [];
        unitsByGroup[group.id].push(unit);
      } else {
        ungrouped.push(unit);
      }
    }

    for (const group of groupList) {
      if (unitsByGroup[group.id]) {
        grouped.push(...unitsByGroup[group.id]);
      }
    }

    return [...grouped, ...ungrouped];
  }, [unitObjects, groupList]);

  // Standalone effects grouped by type
  const standaloneEffectsByType = React.useMemo(() => {
    const byType: Record<string, typeof standaloneEffects> = {};
    for (const eff of standaloneEffects) {
      const t = eff.effectType || 'unknown';
      if (!byType[t]) byType[t] = [];
      byType[t].push(eff);
    }
    return byType;
  }, [standaloneEffects]);
  const standaloneEffectTypes = Object.keys(standaloneEffectsByType);
  const [expandedStandaloneEffects, setExpandedStandaloneEffects] = useState<Record<string, boolean>>({});

  const narrationEvents = activeScene.narrationEvents || [];
  const overlayEvents = activeScene.overlayEvents || [];
  const soundEvents = activeScene.soundEvents || [];

  // Track visibility: show only if has events
  const hasNarration = narrationEvents.length > 0;
  const hasOverlay = overlayEvents.length > 0;
  const hasSound = soundEvents.length > 0;

  const handleAddNarration = () => {
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

  const handleAddSound = () => {
    const lastEnd = soundEvents.reduce((max, s) => Math.max(max, s.startTime + s.duration), 0);
    const startAt = lastEnd > currentTime ? lastEnd + 100 : currentTime;
    const event: SoundEvent = {
      id: uuid(), startTime: startAt, duration: 2000,
      audioUrl: '', label: 'Sound', volume: 1,
    };
    useEditorStore.getState().addSound(event);
  };

  const toggleStandaloneEffectExpanded = (effType: string) => {
    setExpandedStandaloneEffects((prev) => ({ ...prev, [effType]: !prev[effType] }));
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

  /** Keyframe drag handler */
  const makeKeyframeDragHandler = (objectId: string, kfIndex: number, origTime: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const onMove = (me: MouseEvent) => {
      const dx = me.clientX - startX;
      const dtMs = dx / pxPerMs;
      const newTime = Math.max(0, Math.min(totalDuration, origTime + dtMs));
      useEditorStore.getState().updateKeyframe(objectId, kfIndex, { time: newTime });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  /** Reusable timeline block with move + resize handles */
  const TimelineBlock: React.FC<{
    left: number;
    width: number;
    label: string;
    sublabel?: string;
    isSelected: boolean;
    bgColor?: string;
    borderColor?: string;
    colorClass?: string;
    borderClass?: string;
    onClick: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
    onMoveDown: (e: React.MouseEvent) => void;
    onResizeLeft: (e: React.MouseEvent) => void;
    onResizeRight: (e: React.MouseEvent) => void;
  }> = ({ left, width, label, sublabel, isSelected, bgColor, borderColor, colorClass, borderClass, onClick, onDelete, onMoveDown, onResizeLeft, onResizeRight }) => {
    const useInline = bgColor && borderColor;
    const style: React.CSSProperties = { left, width: Math.max(width, 24) };
    if (useInline) {
      style.backgroundColor = isSelected ? bgColor : bgColor + '66';
      style.borderColor = borderColor;
    }
    return (
      <div
        className={`absolute top-1 h-4 rounded-sm flex items-center px-1 group cursor-grab active:cursor-grabbing border ${
          useInline ? (isSelected ? 'border-2' : '') : (isSelected ? `${colorClass} border-2 ${borderClass}` : `${colorClass?.replace('/40', '/20')} border ${borderClass}/40`)
        }`}
        style={style}
        title={sublabel ? `${label} · ${sublabel}` : label}
        onClick={onClick}
        onMouseDown={onMoveDown}
      >
        <span className="text-[7px] font-mono truncate pointer-events-none flex-1 text-foreground">{label}</span>
        {onDelete && (
          <button onClick={onDelete} className="ml-auto text-destructive opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"><Trash2 size={8} /></button>
        )}
        <div className="absolute left-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 rounded-l-sm pointer-events-auto"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          onMouseDown={(e) => { e.stopPropagation(); onResizeLeft(e); }} />
        <div className="absolute right-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover:opacity-100 rounded-r-sm pointer-events-auto"
          style={{ background: 'rgba(255,255,255,0.15)' }}
          onMouseDown={(e) => { e.stopPropagation(); onResizeRight(e); }} />
      </div>
    );
  };

  const confirmDeleteTrack = () => {
    if (deleteTrackId) {
      removeObject(deleteTrackId);
      setDeleteTrackId(null);
      setDeleteTrackLabel('');
    }
  };

  return (
    <div className="bg-timeline border-t border-border flex flex-col h-full">
      {/* Controls bar */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0 bg-timeline z-20 ${timeframeLocked ? 'sticky top-0' : ''}`}>
        <button onClick={() => seekTo(0)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><SkipBack size={14} /></button>
        <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors">
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={() => seekTo(totalDuration)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><SkipForward size={14} /></button>
        <span className="font-mono text-xs text-primary ml-2 amber-glow">{formatTime(currentTime)}</span>
        <span className="font-mono text-[10px] text-muted-foreground">/ {formatTime(totalDuration)}</span>

        <div className="flex-1" />

        {/* Add track dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1.5 rounded transition-colors flex items-center gap-1 text-[9px] font-mono uppercase border text-muted-foreground hover:text-foreground border-border"
              title="Add track"
            >
              <Plus size={10} /> Track
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            <DropdownMenuItem onClick={handleAddNarration} className="text-xs font-mono">
              📝 Narration
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddOverlay} className="text-xs font-mono">
              🖼️ Overlay
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddSound} className="text-xs font-mono">
              🔊 Sound
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Lock timeframe toggle */}
        <button
          onClick={() => setTimeframeLocked(!timeframeLocked)}
          className={`p-1.5 rounded transition-colors flex items-center gap-1 text-[9px] font-mono uppercase border ${
            timeframeLocked
              ? 'bg-primary/20 text-primary border-primary/50'
              : 'text-muted-foreground hover:text-foreground border-border'
          }`}
          title={timeframeLocked ? 'Unlock timeframe' : 'Lock timeframe'}
        >
          {timeframeLocked ? <Lock size={10} /> : <Unlock size={10} />}
          {timeframeLocked ? 'Locked' : 'Lock'}
        </button>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 border border-border rounded px-1 ml-1">
          <button onClick={() => setTimelineZoom(Math.max(0.25, timelineZoom - 0.25))} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Zoom out">
            <ZoomOut size={12} />
          </button>
          <span className="text-[9px] font-mono text-muted-foreground min-w-[32px] text-center">{Math.round(timelineZoom * 100)}%</span>
          <button onClick={() => setTimelineZoom(Math.min(4, timelineZoom + 0.25))} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Zoom in">
            <ZoomIn size={12} />
          </button>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground ml-2">{totalKeyframes} kf</span>
      </div>

      {/* Timeline tracks */}
      <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-tactical px-3 py-2">
        {/* Time ruler */}
        <div className={`relative h-5 mb-1 cursor-pointer ${timeframeLocked ? 'sticky top-0 z-10 bg-timeline' : ''}`} onMouseDown={handleRulerScrub} style={{ width: timelineWidth }}>
          {isRecording && recordingSession && (
            <div className="absolute top-0 h-full bg-destructive/15 border-l border-r border-destructive/40" style={{ left: recordingSession.startTime * pxPerMs, width: recordingSession.durationMs * pxPerMs }} />
          )}
          {Array.from({ length: Math.ceil(totalDuration / 1000) + 1 }, (_, i) => (
            <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: i * 1000 * pxPerMs }}>
              <div className="w-px h-3 bg-border" />
              <span className="text-[8px] font-mono text-muted-foreground">{i}s</span>
            </div>
          ))}
          <div className="absolute top-0 w-0.5 h-full bg-playhead z-10" style={{ left: currentTime * pxPerMs }} />
        </div>

        {/* Narration track — only shown when has events */}
        {hasNarration && (
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
        )}

        {/* Overlay track — only shown when has events */}
        {hasOverlay && (
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
        )}

        {/* Sound track — only shown when has events */}
        {hasSound && (
          <div className="relative h-6 mb-0.5 rounded-sm border border-primary/30 bg-primary/5" style={{ width: timelineWidth }}>
            <span className="absolute left-1 top-0.5 text-[9px] font-mono text-primary/70 uppercase pointer-events-none flex items-center gap-1">
              <Volume2 size={9} /> Sound
            </span>
            {soundEvents.map((snd) => (
              <TimelineBlock
                key={snd.id}
                left={snd.startTime * pxPerMs}
                width={snd.duration * pxPerMs}
                label={snd.label}
                sublabel={`${(snd.duration / 1000).toFixed(1)}s`}
                isSelected={false}
                bgColor="#d4a84355"
                borderColor="#d4a843"
                onClick={(e) => { e.stopPropagation(); }}
                onDelete={(e) => { e.stopPropagation(); removeSound(snd.id); }}
                onMoveDown={makeBlockDragHandler('move', (st, dur) => {
                  useEditorStore.getState().updateSound(snd.id, { startTime: st, duration: dur });
                }, snd.startTime, snd.duration)}
                onResizeLeft={makeBlockDragHandler('resize-left', (st, dur) => {
                  useEditorStore.getState().updateSound(snd.id, { startTime: st, duration: dur });
                }, snd.startTime, snd.duration)}
                onResizeRight={makeBlockDragHandler('resize-right', (st, dur) => {
                  useEditorStore.getState().updateSound(snd.id, { startTime: st, duration: dur });
                }, snd.startTime, snd.duration)}
              />
            ))}
          </div>
        )}

        {/* Unit tracks */}
        {sortedUnits.slice(0, 50).map((unit) => {
          const unitKfs = activeScene.keyframesByObjectId[unit.id] || [];
          const unitEffects = activeScene.effectsByObjectId[unit.id] || [];
          const isSelected = selectedIds.includes(unit.id);
          const group = groupList.find((g) => g.memberIds.includes(unit.id));

          return (
            <div key={unit.id} className="mb-0.5">
              <div
                className={`relative h-6 rounded-sm border cursor-pointer group ${isSelected ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'}`}
                style={{
                  width: timelineWidth,
                  borderLeftWidth: group ? 3 : undefined,
                  borderLeftColor: group ? group.color : undefined,
                }}
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
                  {unit.label || unit.unitType || 'Unit'}{unitKfs.length > 0 ? ` · ${unitKfs.length}kf` : ''}
                  {unitEffects.length > 0 ? ` · ${unitEffects.length}fx` : ''}
                </span>

                {/* Delete track button */}
                <button
                  className="absolute right-1 top-0.5 text-destructive/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTrackId(unit.id);
                    setDeleteTrackLabel(unit.label || unit.unitType || 'this track');
                  }}
                  title="Delete track"
                >
                  <Trash2 size={10} />
                </button>

                {/* Keyframe markers */}
                {unitKfs.map((kf, idx) => {
                  const isKfSelected = selectedKeyframeIndex?.objectId === unit.id && selectedKeyframeIndex?.index === idx;
                  return (
                    <div
                      key={`kf-${idx}`}
                      className={`absolute top-1 w-3 h-3 rounded-full border cursor-pointer hover:scale-125 transition-transform ${
                        isKfSelected
                          ? 'bg-primary border-primary-foreground scale-125'
                          : 'bg-keyframe border-primary-foreground'
                      }`}
                      style={{ left: kf.time * pxPerMs - 6 }}
                      title={`t=${formatTime(kf.time)} · Click to select, drag to move`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedKeyframeIndex({ objectId: unit.id, index: idx });
                        setSelectedIds([unit.id]);
                      }}
                      onMouseDown={(e) => {
                        if (e.button === 0) {
                          makeKeyframeDragHandler(unit.id, idx, kf.time)(e);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeKeyframe(unit.id, idx);
                      }}
                    />
                  );
                })}

                {/* Effect indicator dots + expand toggle */}
                {unitEffects.length > 0 && (
                  <button
                    className="absolute right-8 top-0.5 text-[8px] font-mono text-muted-foreground hover:text-foreground z-10 flex items-center gap-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedUnitEffects(prev => ({ ...prev, [unit.id]: !prev[unit.id] }));
                    }}
                    title={expandedUnitEffects[unit.id] ? 'Collapse effects' : 'Expand effects'}
                  >
                    {expandedUnitEffects[unit.id] ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    {unitEffects.length}fx
                  </button>
                )}
                {/* Small colored dots as quick indicators */}
                {unitEffects.map((eff, effIdx) => {
                  const effColor = EFFECT_COLORS[eff.type] || '#ff6600';
                  return (
                    <div
                      key={eff.id}
                      className="absolute bottom-0.5 w-2 h-2 rounded-full pointer-events-none"
                      style={{ left: eff.startTime * pxPerMs - 4, backgroundColor: effColor }}
                    />
                  );
                })}
              </div>

              {/* Expanded effect sub-rows */}
              {expandedUnitEffects[unit.id] && unitEffects.length > 0 && (
                <div className="ml-4 space-y-0.5 mt-0.5">
                  {unitEffects.map((eff) => {
                    const effColor = EFFECT_COLORS[eff.type] || '#ff6600';
                    const effLeft = eff.startTime * pxPerMs;
                    const effWidth = Math.max(8, eff.duration * pxPerMs);
                    const selectedEffectId = useEditorStore.getState().selectedEffectId;
                    const isEffSelected = selectedEffectId?.objectId === unit.id && selectedEffectId?.effectId === eff.id;
                    return (
                      <div key={eff.id} className="relative h-4 rounded-sm border border-border/30" style={{ width: timelineWidth - 16, backgroundColor: effColor + '08' }}>
                        <TimelineBlock
                          left={effLeft}
                          width={effWidth}
                          label={eff.type}
                          sublabel={`${(eff.duration / 1000).toFixed(1)}s`}
                          isSelected={isEffSelected}
                          bgColor={effColor + '55'}
                          borderColor={effColor}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIds([unit.id]);
                            useEditorStore.getState().setSelectedEffectId({ objectId: unit.id, effectId: eff.id });
                          }}
                          onDelete={(e) => {
                            e.stopPropagation();
                            useEditorStore.getState().removeEffect(unit.id, eff.id);
                          }}
                          onMoveDown={makeBlockDragHandler('move', (st, dur) => {
                            useEditorStore.getState().updateEffect(unit.id, eff.id, { startTime: st, duration: dur });
                          }, eff.startTime, eff.duration)}
                          onResizeLeft={makeBlockDragHandler('resize-left', (st, dur) => {
                            useEditorStore.getState().updateEffect(unit.id, eff.id, { startTime: st, duration: dur });
                          }, eff.startTime, eff.duration)}
                          onResizeRight={makeBlockDragHandler('resize-right', (st, dur) => {
                            useEditorStore.getState().updateEffect(unit.id, eff.id, { startTime: st, duration: dur });
                          }, eff.startTime, eff.duration)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Standalone effects section */}
        {standaloneEffectTypes.length > 0 && (
          <div className="mt-1 pt-1 border-t border-border/30">
            <span className="text-[8px] font-mono uppercase text-muted-foreground/60 mb-0.5 block">Map Effects</span>
            {standaloneEffectTypes.map((effType) => {
              const effs = standaloneEffectsByType[effType];
              const effColor = EFFECT_COLORS[effType] || '#ff6600';
              const isExpanded = expandedStandaloneEffects[effType] ?? true;

              return (
                <div key={`standalone-${effType}`} className="mb-0.5">
                  <div
                    className="relative h-5 rounded-sm border border-border/50 cursor-pointer group"
                    style={{ width: timelineWidth, borderLeftWidth: 3, borderLeftColor: effColor, backgroundColor: effColor + '08' }}
                    onClick={() => toggleStandaloneEffectExpanded(effType)}
                  >
                    <span className="absolute left-1 top-0 text-[8px] font-mono text-muted-foreground uppercase pointer-events-none flex items-center gap-1">
                      <span className="pointer-events-auto">{isExpanded ? <ChevronDown size={8} /> : <ChevronRight size={8} />}</span>
                      {effType} ({effs.length})
                    </span>
                    {!isExpanded && effs.map((effObj) => {
                      const objEffects = activeScene.effectsByObjectId[effObj.id] || [];
                      return objEffects.map((eff) => (
                        <div key={eff.id} className="absolute top-1.5 w-2 h-2 rounded-full pointer-events-none" style={{ left: eff.startTime * pxPerMs - 4, backgroundColor: effColor }} />
                      ));
                    })}
                  </div>
                  {isExpanded && effs.map((effObj) => {
                    const objEffects = activeScene.effectsByObjectId[effObj.id] || [];
                    return objEffects.map((eff) => {
                      const effLeft = eff.startTime * pxPerMs;
                      const effWidth = Math.max(eff.duration * pxPerMs, 16);
                      return (
                        <div key={eff.id} className="relative h-4 ml-4 rounded-sm border border-border/30" style={{ width: timelineWidth - 16, backgroundColor: effColor + '05' }}>
                          <TimelineBlock
                            left={effLeft}
                            width={effWidth}
                            label={effObj.label || ''}
                            sublabel={formatTime(eff.startTime)}
                            isSelected={selectedIds.includes(effObj.id)}
                            bgColor={effColor + '55'}
                            borderColor={effColor}
                            onClick={(e) => { e.stopPropagation(); setSelectedIds([effObj.id]); }}
                            onDelete={(e) => { e.stopPropagation(); setDeleteTrackId(effObj.id); setDeleteTrackLabel(effObj.label || 'this effect'); }}
                            onMoveDown={makeBlockDragHandler('move', (st, dur) => {
                              useEditorStore.getState().updateEffect(effObj.id, eff.id, { startTime: st, duration: dur });
                            }, eff.startTime, eff.duration)}
                            onResizeLeft={makeBlockDragHandler('resize-left', (st, dur) => {
                              useEditorStore.getState().updateEffect(effObj.id, eff.id, { startTime: st, duration: dur });
                            }, eff.startTime, eff.duration)}
                            onResizeRight={makeBlockDragHandler('resize-right', (st, dur) => {
                              useEditorStore.getState().updateEffect(effObj.id, eff.id, { startTime: st, duration: dur });
                            }, eff.startTime, eff.duration)}
                          />
                        </div>
                      );
                    });
                  })}
                </div>
              );
            })}
          </div>
        )}

        {sortedUnits.length === 0 && standaloneEffectTypes.length === 0 && (
          <div className="text-center py-4 text-[10px] font-mono text-muted-foreground">
            Add units to see timeline tracks
          </div>
        )}
      </div>

      {/* Delete track confirmation dialog */}
      <Dialog open={!!deleteTrackId} onOpenChange={(open) => { if (!open) { setDeleteTrackId(null); setDeleteTrackLabel(''); } }}>
        <DialogContent className="sm:max-w-[340px] bg-panel border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-mono uppercase text-primary">Delete Track</DialogTitle>
            <DialogDescription className="text-xs font-mono text-muted-foreground">
              Are you sure you want to delete "{deleteTrackLabel}"? This will remove all its keyframes, effects, and data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              onClick={() => { setDeleteTrackId(null); setDeleteTrackLabel(''); }}
              className="px-4 py-2 text-[10px] font-mono uppercase bg-muted border border-border rounded text-foreground hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteTrack}
              className="px-4 py-2 text-[10px] font-mono uppercase bg-destructive/20 text-destructive border border-destructive/50 rounded hover:bg-destructive/30 transition-colors"
            >
              Delete
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimelinePanel;
