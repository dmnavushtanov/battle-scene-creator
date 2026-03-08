import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

const TimelinePanel: React.FC = () => {
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const seekTo = useEditorStore((s) => s.seekTo);
  const computeDerivedTransforms = useEditorStore((s) => s.computeDerivedTransforms);
  const isRecording = useEditorStore((s) => s.isRecording);
  const recordingSession = useEditorStore((s) => s.recordingSession);
  const recordDurationSeconds = useEditorStore((s) => s.recordDurationSeconds);

  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });
  const selectedIds = useEditorStore((s) => s.selectedIds);

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

  // Count total keyframes
  const totalKeyframes = Object.values(activeScene.keyframesByObjectId).reduce(
    (sum, kfs) => sum + kfs.length,
    0
  );

  // Playback loop
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

        // Update currentTime without re-triggering this effect
        useEditorStore.setState({ currentTime: newTime });
        computeDerivedTransforms(newTime);
        playRef.current = requestAnimationFrame(tick);
      };

      // Compute initial frame
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

  return (
    <div className="bg-timeline border-t border-border flex flex-col h-full">
      {/* Controls bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <button
          onClick={() => seekTo(0)}
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
          onClick={() => seekTo(totalDuration)}
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
          {totalKeyframes} keyframes
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
          <div
            className="absolute top-0 w-0.5 h-full bg-playhead z-10"
            style={{ left: currentTime * pxPerMs }}
          />
        </div>

        {/* Unit tracks */}
        {units.slice(0, 10).map((unit) => {
          const unitKfs = activeScene.keyframesByObjectId[unit.id] || [];
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
                {unit.unitType || unit.label}
              </span>
              {unitKfs.map((kf, idx) => (
                <div
                  key={idx}
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
