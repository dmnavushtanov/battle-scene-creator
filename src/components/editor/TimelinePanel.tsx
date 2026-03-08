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
    return () => {
      if (playRef.current) cancelAnimationFrame(playRef.current);
    };
  }, [isPlaying]);

  const units = activeScene.objectOrder
    .map((id) => activeScene.objectsById[id])
    .filter((o) => o && o.type === 'unit');

  const narrationEvents = activeScene.narrationEvents || [];
  const overlayEvents = activeScene.overlayEvents || [];

  const handleAddNarration = () => {
    const event: NarrationEvent = {
      id: uuid(),
      type: 'text',
      startTime: currentTime,
      duration: 3000,
      text: 'Narration text...',
      position: 'bottom',
      fontSize: 24,
      fontStyle: 'normal',
      textAnimation: 'fade',
      textColor: '#ffffff',
      bgOpacity: 0.6,
    };
    addNarration(event);
  };

  const handleAddOverlay = () => {
    const event: OverlayEvent = {
      id: uuid(),
      startTime: currentTime,
      duration: 4000,
      imageUrl: '',
      imagePosition: 'center',
      imageScale: 1,
      backgroundEffect: 'blur+dim',
      dimOpacity: 0.7,
      title: 'Title',
      subtitle: 'Subtitle',
      textPosition: 'below-image',
      transition: 'fade',
    };
    addOverlay(event);
  };

  return (
    <div className="bg-timeline border-t border-border flex flex-col h-full">
      {/* Controls bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <button onClick={() => seekTo(0)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <SkipBack size={14} />
        </button>
        <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors">
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button onClick={() => seekTo(totalDuration)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <SkipForward size={14} />
        </button>

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
            <div
              className="absolute top-0 h-full bg-destructive/15 border-l border-r border-destructive/40"
              style={{ left: recordingSession.startTime * pxPerMs, width: recordingSession.durationMs * pxPerMs }}
            />
          )}
          {!isRecording && !isPlaying && (
            <div
              className="absolute top-0 h-full bg-primary/5 border-l border-r border-primary/20 pointer-events-none"
              style={{ left: currentTime * pxPerMs, width: recordDurationSeconds * 1000 * pxPerMs }}
            />
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
            📝 Narration
            <button onClick={(e) => { e.stopPropagation(); handleAddNarration(); }} className="ml-1 hover:text-accent transition-colors">
              <Plus size={10} />
            </button>
          </span>
          {narrationEvents.map((n) => (
            <div
              key={n.id}
              className="absolute top-1 h-4 bg-accent/20 border border-accent/40 rounded-sm flex items-center px-1 group cursor-default"
              style={{ left: n.startTime * pxPerMs, width: Math.max(n.duration * pxPerMs, 20) }}
              title={n.text || 'Narration'}
            >
              <span className="text-[7px] font-mono text-accent truncate">{n.text?.slice(0, 15) || '...'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeNarration(n.id); }}
                className="ml-auto text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={8} />
              </button>
            </div>
          ))}
        </div>

        {/* Overlay track */}
        <div className="relative h-6 mb-0.5 rounded-sm border border-secondary/30 bg-secondary/5" style={{ width: timelineWidth }}>
          <span className="absolute left-1 top-0.5 text-[9px] font-mono text-secondary-foreground/70 uppercase pointer-events-none flex items-center gap-1">
            🖼️ Overlay
            <button onClick={(e) => { e.stopPropagation(); handleAddOverlay(); }} className="ml-1 hover:text-secondary-foreground transition-colors">
              <Plus size={10} />
            </button>
          </span>
          {overlayEvents.map((o) => (
            <div
              key={o.id}
              className="absolute top-1 h-4 bg-secondary/20 border border-secondary/40 rounded-sm flex items-center px-1 group cursor-default"
              style={{ left: o.startTime * pxPerMs, width: Math.max(o.duration * pxPerMs, 20) }}
              title={o.title || 'Overlay'}
            >
              <span className="text-[7px] font-mono text-secondary-foreground truncate">{o.title || 'Overlay'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeOverlay(o.id); }}
                className="ml-auto text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={8} />
              </button>
            </div>
          ))}
        </div>

        {/* Unit tracks */}
        {units.slice(0, 10).map((unit) => {
          const unitKfs = activeScene.keyframesByObjectId[unit.id] || [];
          const unitEffects = activeScene.effectsByObjectId[unit.id] || [];
          const isSelected = selectedIds.includes(unit.id);

          return (
            <div
              key={unit.id}
              className={`relative h-6 mb-0.5 rounded-sm border cursor-pointer ${
                isSelected ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'
              }`}
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
              <span className="absolute left-1 top-0.5 text-[9px] font-mono text-muted-foreground uppercase pointer-events-none">
                {unit.label || unit.unitType}{unitKfs.length > 0 ? ` · ${unitKfs.length}kf` : ''}{unitEffects.length > 0 ? ` · ${unitEffects.length}fx` : ''}
              </span>
              {unitKfs.map((kf, idx) => (
                <div
                  key={`kf-${idx}`}
                  className="absolute top-1 w-3 h-3 bg-keyframe rounded-full border border-primary-foreground pointer-events-none"
                  style={{ left: kf.time * pxPerMs - 6 }}
                  title={`t=${formatTime(kf.time)}`}
                />
              ))}
              {/* Effect markers - clickable + resizable */}
              {unitEffects.map((eff) => {
                const preset = EFFECT_PRESETS.find((p) => p.type === eff.type);
                const effLeft = eff.startTime * pxPerMs;
                const effWidth = Math.max(eff.duration * pxPerMs, 12);
                return (
                  <div
                    key={eff.id}
                    className="absolute top-1 h-4 bg-destructive/20 border border-destructive/30 rounded-sm flex items-center justify-center cursor-pointer hover:bg-destructive/30 group/eff"
                    style={{ left: effLeft, width: effWidth }}
                    title={`${preset?.label || eff.type} @ ${formatTime(eff.startTime)} — drag edges to resize`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[7px] pointer-events-none">{preset?.icon || '?'}</span>
                    {/* Left resize handle */}
                    <div
                      className="absolute left-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover/eff:opacity-100 bg-destructive/40 rounded-l-sm"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const origStart = eff.startTime;
                        const origDur = eff.duration;
                        const onMove = (me: MouseEvent) => {
                          const dx = me.clientX - startX;
                          const dtMs = dx / pxPerMs;
                          const newStart = Math.max(0, origStart + dtMs);
                          const newDur = Math.max(100, origDur - (newStart - origStart));
                          useEditorStore.getState()._updateActiveScene((s) => ({
                            ...s,
                            effectsByObjectId: {
                              ...s.effectsByObjectId,
                              [unit.id]: (s.effectsByObjectId[unit.id] || []).map((ef) =>
                                ef.id === eff.id ? { ...ef, startTime: newStart, duration: newDur } : ef
                              ),
                            },
                          }));
                        };
                        const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                      }}
                    />
                    {/* Right resize handle */}
                    <div
                      className="absolute right-0 top-0 w-2 h-full cursor-ew-resize opacity-0 group-hover/eff:opacity-100 bg-destructive/40 rounded-r-sm"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const origDur = eff.duration;
                        const onMove = (me: MouseEvent) => {
                          const dx = me.clientX - startX;
                          const dtMs = dx / pxPerMs;
                          const newDur = Math.max(100, origDur + dtMs);
                          useEditorStore.getState()._updateActiveScene((s) => ({
                            ...s,
                            effectsByObjectId: {
                              ...s.effectsByObjectId,
                              [unit.id]: (s.effectsByObjectId[unit.id] || []).map((ef) =>
                                ef.id === eff.id ? { ...ef, duration: newDur } : ef
                              ),
                            },
                          }));
                        };
                        const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                        window.addEventListener('mousemove', onMove);
                        window.addEventListener('mouseup', onUp);
                      }}
                    />
                  </div>
                );
              })}
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
