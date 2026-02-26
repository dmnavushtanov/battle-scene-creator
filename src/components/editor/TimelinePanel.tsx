import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Play, Pause, SkipBack, SkipForward, Plus } from 'lucide-react';

const TimelinePanel: React.FC = () => {
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const scenes = useEditorStore((s) => s.project.scenes);
  const objects = useEditorStore((s) => s.project.objects);
  const keyframes = useEditorStore((s) => s.project.keyframes);
  const selectedIds = useEditorStore((s) => s.selectedIds);

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);
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
    setCurrentTime(time);
  };

  // Playback loop
  const playRef = React.useRef<number | null>(null);
  const lastTimeRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      const tick = (now: number) => {
        const delta = now - lastTimeRef.current;
        lastTimeRef.current = now;
        const newTime = currentTime + delta;
        if (newTime >= totalDuration) {
          setCurrentTime(0);
          setIsPlaying(false);
          return;
        }
        setCurrentTime(newTime);
        playRef.current = requestAnimationFrame(tick);
      };
      playRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (playRef.current) cancelAnimationFrame(playRef.current);
    };
  }, [isPlaying]);

  const units = objects.filter((o) => o.type === 'unit');

  return (
    <div className="bg-timeline border-t border-border flex flex-col">
      {/* Controls bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <button
          onClick={() => setCurrentTime(0)}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <SkipBack size={14} />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="p-1.5 bg-primary/20 text-primary rounded hover:bg-primary/30 transition-colors"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          onClick={() => setCurrentTime(totalDuration)}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <SkipForward size={14} />
        </button>

        <span className="font-mono text-xs text-primary ml-2 amber-glow">
          {formatTime(currentTime)}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          / {formatTime(totalDuration)}
        </span>

        <div className="flex-1" />

        <span className="text-[10px] font-mono text-muted-foreground">
          {keyframes.length} keyframes
        </span>
      </div>

      {/* Timeline tracks */}
      <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-tactical px-3 py-2">
        {/* Time ruler */}
        <div
          className="relative h-5 mb-1 cursor-pointer"
          onClick={handleTimelineClick}
          style={{ width: timelineWidth }}
        >
          {/* Tick marks */}
          {Array.from({ length: Math.ceil(totalDuration / 1000) + 1 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: i * 1000 * pxPerMs }}
            >
              <div className="w-px h-3 bg-border" />
              <span className="text-[8px] font-mono text-muted-foreground">{i}s</span>
            </div>
          ))}
          {/* Playhead */}
          <div
            className="absolute top-0 w-0.5 h-full bg-playhead z-10"
            style={{ left: currentTime * pxPerMs }}
          />
        </div>

        {/* Unit tracks */}
        {units.slice(0, 10).map((unit) => {
          const unitKfs = keyframes.filter((k) => k.objectId === unit.id);
          const isSelected = selectedIds.includes(unit.id);

          return (
            <div
              key={unit.id}
              className={`relative h-6 mb-0.5 rounded-sm border ${
                isSelected ? 'border-primary/50 bg-primary/5' : 'border-border bg-muted/30'
              }`}
              style={{ width: timelineWidth }}
            >
              <span className="absolute left-1 top-0.5 text-[9px] font-mono text-muted-foreground uppercase">
                {unit.unitType} ({unit.side})
              </span>
              {/* Keyframe dots */}
              {unitKfs.map((kf) => (
                <div
                  key={kf.id}
                  className="absolute top-1 w-3 h-3 bg-keyframe rounded-full border border-primary-foreground"
                  style={{ left: kf.time * pxPerMs - 6 }}
                  title={`t=${formatTime(kf.time)}`}
                />
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
