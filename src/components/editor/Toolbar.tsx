import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import type { DrawToolType } from '@/types/editor';
import {
  MousePointer2,
  MoveRight,
  Minus,
  Pencil,
  Square,
  Circle,
  Fence,
  Trash2,
  Download,
  Upload,
  Film,
} from 'lucide-react';

const TOOLS: { tool: DrawToolType; icon: React.ReactNode; label: string }[] = [
  { tool: 'select', icon: <MousePointer2 size={16} />, label: 'Select' },
  { tool: 'arrow', icon: <MoveRight size={16} />, label: 'Arrow' },
  { tool: 'line', icon: <Minus size={16} />, label: 'Line' },
  { tool: 'freehand', icon: <Pencil size={16} />, label: 'Draw' },
  { tool: 'rectangle', icon: <Square size={16} />, label: 'Rect' },
  { tool: 'circle', icon: <Circle size={16} />, label: 'Circle' },
  { tool: 'trench', icon: <Fence size={16} />, label: 'Trench' },
];

const Toolbar: React.FC = () => {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const removeObject = useEditorStore((s) => s.removeObject);
  const exportProject = useEditorStore((s) => s.exportProject);
  const importProject = useEditorStore((s) => s.importProject);

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
