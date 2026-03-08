import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { exportVideo } from '@/domain/services/videoExport';
import type { DrawToolType } from '@/domain/models';
import Konva from 'konva';
import {
  MousePointer2,
  MoveRight,
  Minus,
  Pencil,
  Square,
  Circle,
  Trash2,
  Download,
  Upload,
  Film,
  CircleDot,
  StopCircle,
  Loader2,
} from 'lucide-react';

const TOOLS: { tool: DrawToolType; icon: React.ReactNode; label: string }[] = [
  { tool: 'select', icon: <MousePointer2 size={16} />, label: 'Select' },
  { tool: 'arrow', icon: <MoveRight size={16} />, label: 'Arrow' },
  { tool: 'line', icon: <Minus size={16} />, label: 'Line' },
  { tool: 'freehand', icon: <Pencil size={16} />, label: 'Draw' },
  { tool: 'rectangle', icon: <Square size={16} />, label: 'Rect' },
  { tool: 'circle', icon: <Circle size={16} />, label: 'Circle' },
];

const Toolbar: React.FC = () => {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const removeObject = useEditorStore((s) => s.removeObject);
  const exportProject = useEditorStore((s) => s.exportProject);
  const importProject = useEditorStore((s) => s.importProject);
  const isRecording = useEditorStore((s) => s.isRecording);
  const startRecording = useEditorStore((s) => s.startRecording);
  const stopRecording = useEditorStore((s) => s.stopRecording);
  const recordDurationSeconds = useEditorStore((s) => s.recordDurationSeconds);
  const setRecordDurationSeconds = useEditorStore((s) => s.setRecordDurationSeconds);
  const currentTime = useEditorStore((s) => s.currentTime);
  const computeDerivedTransforms = useEditorStore((s) => s.computeDerivedTransforms);

  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatSec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  const handleDelete = () => {
    selectedIds.forEach((id) => removeObject(id));
  };

  const handleExport = () => {
    const json = exportProject();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'battle-project.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importProject(reader.result as string);
    reader.readAsText(file);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleVideoExport = async () => {
    const stageRef = (window as any).__konvaStageRef;
    if (!stageRef?.current) return;

    const stage = stageRef.current as Konva.Stage;
    const scene = useEditorStore.getState().getActiveScene();

    setIsExporting(true);
    setExportProgress(0);

    try {
      const blob = await exportVideo({
        stage,
        duration: scene.duration,
        fps: 30,
        onProgress: setExportProgress,
        computeFrame: (time: number) => {
          computeDerivedTransforms(time);
          // Force update objects to derived positions for the export
          const state = useEditorStore.getState();
          const transforms = state.derivedTransforms;
          const sc = state.getActiveScene();
          for (const id of sc.objectOrder) {
            const t = transforms[id];
            if (!t) continue;
            // Find the Konva node and update it directly
            const node = stage.findOne(`#unit-${id}`) as Konva.Group;
            if (node) {
              node.x(t.x);
              node.y(t.y);
              node.rotation(t.rotation);
              node.scaleX(t.scaleX);
              node.scaleY(t.scaleY);
              node.visible(t.visible);
            }
          }
        },
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scene.name || 'battle'}-export.webm`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Video export failed:', err);
      alert('Video export failed. Your browser may not support WebM recording.');
    } finally {
      setIsExporting(false);
      // Restore current time
      const time = useEditorStore.getState().currentTime;
      computeDerivedTransforms(time);
    }
  };

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-panel border-b border-border">
      {/* Draw tools */}
      <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-2">
        {TOOLS.map((t) => (
          <button
            key={t.tool}
            onClick={() => setActiveTool(t.tool)}
            title={t.label}
            className={`p-2 rounded transition-colors ${
              activeTool === t.tool
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {t.icon}
          </button>
        ))}
      </div>

      {/* Record button + segment info */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleToggleRecording}
          title={isRecording
            ? 'Stop recording and create keyframes'
            : `Record a ${recordDurationSeconds}s animation segment starting at ${formatSec(currentTime)}`}
          className={`p-2 rounded transition-colors flex items-center gap-1.5 text-[10px] font-mono uppercase border ${
            isRecording
              ? 'bg-destructive/20 text-destructive border-destructive/50 animate-pulse'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border'
          }`}
        >
          {isRecording ? <StopCircle size={14} /> : <CircleDot size={14} />}
          {isRecording ? 'Stop' : 'Record'}
        </button>

        {!isRecording ? (
          <div className="flex items-center gap-1 ml-0.5">
            <input
              type="number"
              min={0.5}
              max={30}
              step={0.5}
              value={recordDurationSeconds}
              onChange={(e) => setRecordDurationSeconds(Math.max(0.5, Number(e.target.value)))}
              className="w-12 bg-muted border border-border rounded px-1.5 py-1 text-[10px] font-mono text-foreground text-center"
              title="How long the recorded movement will take during playback"
            />
            <span className="text-[9px] font-mono text-muted-foreground">sec</span>
            <span className="text-[8px] font-mono text-muted-foreground/60 ml-1 hidden sm:inline">
              {formatSec(currentTime)} → {formatSec(currentTime + recordDurationSeconds * 1000)}
            </span>
          </div>
        ) : (
          <span className="text-[9px] font-mono text-destructive/80">
            Drag units now — positions will animate over {recordDurationSeconds}s
          </span>
        )}
      </div>

      <div className="border-r border-border h-5 mx-2" />

      {/* Actions */}
      <button
        onClick={handleDelete}
        disabled={selectedIds.length === 0}
        title="Delete selected"
        className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
      >
        <Trash2 size={16} />
      </button>

      <div className="flex-1" />

      {/* Project actions */}
      <button
        onClick={() => fileInputRef.current?.click()}
        title="Import project"
        className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Upload size={16} />
      </button>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      
      <button
        onClick={handleExport}
        title="Export project"
        className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Download size={16} />
      </button>

      <button
        onClick={handleVideoExport}
        disabled={isExporting}
        title={isExporting ? `Exporting... ${exportProgress}%` : 'Export animation as WebM video'}
        className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1 flex items-center gap-1.5 border border-border text-[10px] font-mono uppercase disabled:opacity-50"
      >
        {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Film size={14} />}
        {isExporting ? `${exportProgress}%` : 'Video'}
      </button>
    </div>
  );
};

export default Toolbar;
