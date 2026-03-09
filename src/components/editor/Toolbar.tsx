import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { exportVideo } from '@/domain/services/videoExport';
import type { DrawToolType } from '@/domain/models';
import Konva from 'konva';

declare global {
  interface Window {
    __konvaStageRef?: React.RefObject<Konva.Stage | null>;
  }
}
import {
  MousePointer2,
  MoveRight,
  Trash2,
  Download,
  Upload,
  Film,
  CircleDot,
  StopCircle,
  Loader2,
  Route,
  Info,
  TrendingUp,
  Type,
} from 'lucide-react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

const TOOLS: { tool: DrawToolType; icon: React.ReactNode; label: string; tip: string }[] = [
  { tool: 'select', icon: <MousePointer2 size={16} />, label: 'Select', tip: 'Select and move units on the canvas' },
  { tool: 'arrow', icon: <MoveRight size={16} />, label: 'Arrow', tip: 'Draw static arrows between points' },
  { tool: 'animated_arrow', icon: <TrendingUp size={16} />, label: 'Anim Arrow', tip: 'Draw an animated arrow that grows during playback over the record duration' },
  { tool: 'path', icon: <Route size={16} />, label: 'Path', tip: 'Draw movement paths — click waypoints, right-click to save, Esc to cancel' },
  { tool: 'text', icon: <Type size={16} />, label: 'Text', tip: 'Click on canvas to place a text label (city names, dates, annotations)' },
];

type ExportFormat = {
  id: string;
  label: string;
  mimeType: string;
  extension: string;
};

const EXPORT_FORMATS: ExportFormat[] = [
  { id: 'webm-vp9', label: 'WebM (VP9)', mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
  { id: 'webm-vp8', label: 'WebM (VP8)', mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
  { id: 'mp4-h264', label: 'MP4 (H.264)', mimeType: 'video/mp4;codecs=avc1.42E01E', extension: 'mp4' },
  { id: 'ogg-theora', label: 'OGG (Theora)', mimeType: 'video/ogg;codecs=theora', extension: 'ogv' },
];

const EXPORT_RESOLUTIONS = [
  { id: 'source', label: 'Source (1x)', scale: 1 },
  { id: 'hd', label: 'HD-ish (1.5x)', scale: 1.5 },
  { id: 'full-hd', label: 'Full HD-ish (2x)', scale: 2 },
  { id: 'ultra', label: 'Ultra (3x)', scale: 3 },
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
  const seekTo = useEditorStore((s) => s.seekTo);
  const computeDerivedTransforms = useEditorStore((s) => s.computeDerivedTransforms);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const setIsVideoExporting = useEditorStore((s) => s.setIsVideoExporting);
  const recordingSession = useEditorStore((s) => s.recordingSession);
  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });
  const setSceneDuration = useEditorStore((s) => s.setSceneDuration);
  const sceneDuration = activeScene.duration;

  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);
  const [exportFormatId, setExportFormatId] = React.useState(EXPORT_FORMATS[0].id);
  const [exportResolutionId, setExportResolutionId] = React.useState(EXPORT_RESOLUTIONS[2].id);

  const supportedFormats = React.useMemo(
    () => EXPORT_FORMATS.map((format) => ({ ...format, supported: MediaRecorder.isTypeSupported(format.mimeType) })),
    []
  );
  const selectedFormat = supportedFormats.find((f) => f.id === exportFormatId) || supportedFormats[0];
  const selectedResolution = EXPORT_RESOLUTIONS.find((r) => r.id === exportResolutionId) || EXPORT_RESOLUTIONS[0];

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatSec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  const movedCount = recordingSession?.movedObjectIds?.size ?? 0;

  const isPathTool = activeTool === 'path';

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete the selected object(s)?')) return;
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
    const stageRef = window.__konvaStageRef;
    if (!stageRef?.current) return;

    const stage = stageRef.current as Konva.Stage;
    const scene = useEditorStore.getState().getActiveScene();
    const initialTime = useEditorStore.getState().currentTime;

    setIsPlaying(false);
    setIsExporting(true);
    setIsVideoExporting(true);
    setExportProgress(0);

    try {
      const blob = await exportVideo({
        stage,
        duration: scene.duration,
        fps: 30,
        mimeType: selectedFormat.mimeType,
        scale: selectedResolution.scale,
        videoBitsPerSecond: Math.round(12_000_000 * selectedResolution.scale * selectedResolution.scale),
        onProgress: setExportProgress,
        getNarrations: (time: number) => {
          return (scene.narrationEvents || []).filter(
            (n) => time >= n.startTime && time <= n.startTime + n.duration
          );
        },
        computeFrame: (time: number) => {
          const frameTime = Math.min(time, scene.duration);
          seekTo(frameTime);
          const state = useEditorStore.getState();
          const transforms = state.derivedTransforms;
          const sc = state.getActiveScene();
          for (const id of sc.objectOrder) {
            const t = transforms[id];
            if (!t) continue;
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
      a.download = `${scene.name || 'battle'}-export.${selectedFormat.extension}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Video export failed:', err);
      alert('Video export failed. Your browser may not support WebM recording.');
    } finally {
      setIsExporting(false);
      setIsVideoExporting(false);
      seekTo(initialTime);
      computeDerivedTransforms(initialTime);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 px-3 py-2 bg-panel border-b border-border select-none">
        {/* Draw tools */}
        <div className="flex items-center gap-0.5 border-r border-border pr-2 mr-2">
          {TOOLS.map((t) => (
            <Tooltip key={t.tool}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTool(t.tool)}
                  className={`p-2 rounded transition-colors ${
                    activeTool === t.tool
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {t.icon}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{t.tip}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Record section */}
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleToggleRecording}
                className={`p-2 rounded transition-colors flex items-center gap-1.5 text-[10px] font-mono uppercase border ${
                  isRecording
                    ? 'bg-destructive/20 text-destructive border-destructive/50 animate-pulse'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border'
                }`}
              >
                {isRecording ? <StopCircle size={14} /> : <CircleDot size={14} />}
                {isRecording ? 'Stop & Save' : 'Record'}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[280px]">
              {isRecording ? (
                <p className="text-xs">Click Stop & Save to create keyframes from recorded movements</p>
              ) : (
                <div className="text-xs space-y-1">
                  <p className="font-semibold">Record unit movement</p>
                  <p>① Set duration → ② Click Record → ③ Drag units → ④ Stop & Save</p>
                  <p className="text-muted-foreground">All dragged units will animate over the set duration starting at the current playhead.</p>
                </div>
              )}
            </TooltipContent>
          </Tooltip>

          {!isRecording ? (
            <div className="flex items-center gap-1 ml-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${isPathTool ? 'bg-accent/20 border border-accent/40' : ''}`}>
                    <span className="text-[8px] font-mono uppercase text-muted-foreground/70">
                      {isPathTool ? 'Path animates over' : 'Record'}
                    </span>
                    <input
                      type="number"
                      min={0.5}
                      max={30}
                      step={0.5}
                      value={recordDurationSeconds}
                      onChange={(e) => setRecordDurationSeconds(Math.max(0.5, Number(e.target.value)))}
                      className="w-12 bg-muted border border-border rounded px-1.5 py-1 text-[10px] font-mono text-foreground text-center"
                    />
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {isPathTool ? 'sec' : 'sec for moved units'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[260px]">
                  <p className="text-xs">
                    {isPathTool
                      ? 'The path waypoints will be spread over this duration on the timeline.'
                      : 'How many seconds the recorded movement takes. Drag units while recording — their movement animates over this duration.'}
                  </p>
                </TooltipContent>
              </Tooltip>
              <span className="text-[8px] font-mono text-muted-foreground/60 ml-1 hidden sm:inline">
                at {formatSec(currentTime)} → {formatSec(currentTime + recordDurationSeconds * 1000)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-destructive font-semibold flex items-center gap-1">
                🔴 Recording — drag units now
              </span>
              {movedCount > 0 && (
                <span className="text-[9px] font-mono bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">
                  {movedCount} unit{movedCount !== 1 ? 's' : ''} moved
                </span>
              )}
              <span className="text-[8px] font-mono text-muted-foreground/60 hidden sm:inline">
                {recordDurationSeconds}s at {formatSec(currentTime)} → {formatSec(currentTime + recordDurationSeconds * 1000)}
              </span>
            </div>
          )}
        </div>

        <div className="border-r border-border h-5 mx-2" />

        {/* Actions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleDelete}
              disabled={selectedIds.length === 0}
              className="p-2 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
            >
              <Trash2 size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Delete selected objects</p>
          </TooltipContent>
        </Tooltip>

        <div className="border-r border-border h-5 mx-2" />

        {/* Scene Length */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono uppercase text-muted-foreground">Scene Length</span>
              <input
                type="number"
                min={1}
                max={300}
                step={1}
                value={Math.round(sceneDuration / 1000)}
                onChange={(e) => setSceneDuration(Number(e.target.value) * 1000)}
                className="w-12 bg-muted border border-border rounded px-1.5 py-1 text-[10px] font-mono text-foreground text-center"
              />
              <span className="text-[9px] font-mono text-muted-foreground">sec</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Total duration of this scene/video in seconds</p>
          </TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        {/* How-to hint */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="p-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <Info size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[320px]">
            <div className="text-xs space-y-1">
              <p className="font-semibold">Quick Guide</p>
              <p>• <strong>Record</strong>: Set duration → Record → Drag units → Stop & Save</p>
              <p>• <strong>Path tool</strong>: Select 1 unit → Path → click waypoints → right-click to save</p>
              <p>• <strong>Path duration</strong>: uses the "Record __ sec" value from toolbar</p>
              <p>• <strong>Ctrl+C / Ctrl+V</strong>: Copy & paste units or effects</p>
              <p>• <strong>Right-click canvas</strong>: Quick-add menu</p>
              <p>• <strong>Shift+click</strong>: Multi-select units</p>
              <p>• <strong>Shift+click keyframes</strong>: Select multiple, drag together</p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Project actions */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Upload size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Import project from JSON file</p>
          </TooltipContent>
        </Tooltip>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleExport}
              className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Download size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Export project as JSON</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleVideoExport}
              disabled={isExporting || !selectedFormat.supported}
              className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1 flex items-center gap-1.5 border border-border text-[10px] font-mono uppercase disabled:opacity-50"
            >
              {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Film size={14} />}
              {isExporting ? `${exportProgress}%` : 'Video'}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">
              {isExporting
                ? `Exporting... ${exportProgress}%`
                : selectedFormat.supported
                ? 'Export animation with selected format and resolution'
                : 'Selected format is not supported by this browser'}
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-1 ml-2">
          <select
            value={exportFormatId}
            onChange={(e) => setExportFormatId(e.target.value)}
            className="bg-muted border border-border rounded px-1.5 py-1 text-[10px] font-mono text-foreground"
            title="Video export format"
          >
            {supportedFormats.map((format) => (
              <option key={format.id} value={format.id}>
                {format.label}{format.supported ? '' : ' (unsupported)'}
              </option>
            ))}
          </select>

          <select
            value={exportResolutionId}
            onChange={(e) => setExportResolutionId(e.target.value)}
            className="bg-muted border border-border rounded px-1.5 py-1 text-[10px] font-mono text-foreground"
            title="Video export resolution"
          >
            {EXPORT_RESOLUTIONS.map((res) => (
              <option key={res.id} value={res.id}>
                {res.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Toolbar;
