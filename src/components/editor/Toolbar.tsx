import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import type { DrawToolType } from '@/domain/models';
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

  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

      {/* Record button + duration */}
      <button
        onClick={handleToggleRecording}
        title={isRecording ? 'Stop Recording' : 'Record Movement'}
        className={`p-2 rounded transition-colors flex items-center gap-1.5 text-[10px] font-mono uppercase border ${
          isRecording
            ? 'bg-destructive/20 text-destructive border-destructive/50 animate-pulse'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border'
        }`}
      >
        {isRecording ? <StopCircle size={14} /> : <CircleDot size={14} />}
        {isRecording ? 'Stop' : 'Record'}
      </button>

      {!isRecording && (
        <div className="flex items-center gap-1 ml-1">
          <input
            type="number"
            min={0.5}
            max={30}
            step={0.5}
            value={recordDurationSeconds}
            onChange={(e) => setRecordDurationSeconds(Math.max(0.5, Number(e.target.value)))}
            className="w-12 bg-muted border border-border rounded px-1.5 py-1 text-[10px] font-mono text-foreground text-center"
            title="Recording duration (seconds)"
          />
          <span className="text-[9px] font-mono text-muted-foreground">sec</span>
        </div>
      )}

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
        title="Export video (coming soon)"
        className="p-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1 flex items-center gap-1.5 border border-border text-[10px] font-mono uppercase"
      >
        <Film size={14} />
        Export
      </button>
    </div>
  );
};

export default Toolbar;
