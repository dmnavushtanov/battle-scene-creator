import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { v4 as uuid } from 'uuid';

const PropertiesPanel: React.FC = () => {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const objects = useEditorStore((s) => s.project.objects);
  const updateObject = useEditorStore((s) => s.updateObject);
  const currentTime = useEditorStore((s) => s.currentTime);
  const addKeyframe = useEditorStore((s) => s.addKeyframe);

  const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));
  const single = selectedObjects.length === 1 ? selectedObjects[0] : null;

  const handleAddKeyframe = () => {
    if (!single) return;
    addKeyframe({
      id: uuid(),
      objectId: single.id,
      time: currentTime,
      x: single.x,
      y: single.y,
      rotation: single.rotation,
      scaleX: single.scaleX,
      scaleY: single.scaleY,
    });
  };

  if (selectedObjects.length === 0) {
    return (
      <div className="h-full bg-panel border-l border-border flex flex-col">
        <div className="px-3 py-3 border-b border-border">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary amber-glow">
            Properties
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-[10px] font-mono text-muted-foreground text-center">
            Select an object to view its properties
          </p>
        </div>
      </div>
    );
  }

  if (!single) {
    return (
      <div className="h-full bg-panel border-l border-border flex flex-col">
        <div className="px-3 py-3 border-b border-border">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary amber-glow">
            Properties
          </h2>
        </div>
        <div className="px-3 py-3">
          <p className="text-[10px] font-mono text-muted-foreground">
            {selectedObjects.length} objects selected
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-panel border-l border-border flex flex-col">
      <div className="px-3 py-3 border-b border-border">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary amber-glow">
          Properties
        </h2>
      </div>

      <div className="px-3 py-3 flex-1 overflow-y-auto scrollbar-tactical space-y-3">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-primary/20 text-primary rounded">
            {single.unitType || single.type}
          </span>
          <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-muted text-muted-foreground rounded">
            {single.side}
          </span>
        </div>

        {/* Position */}
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Position</label>
          <div className="flex gap-2 mt-1">
            <div className="flex-1">
              <label className="text-[8px] font-mono text-muted-foreground">X</label>
              <input
                type="number"
                value={Math.round(single.x)}
                onChange={(e) => updateObject(single.id, { x: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground"
              />
            </div>
            <div className="flex-1">
              <label className="text-[8px] font-mono text-muted-foreground">Y</label>
              <input
                type="number"
                value={Math.round(single.y)}
                onChange={(e) => updateObject(single.id, { y: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Rotation</label>
          <input
            type="number"
            value={Math.round(single.rotation)}
            onChange={(e) => updateObject(single.id, { rotation: Number(e.target.value) })}
            className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground mt-1"
          />
        </div>

        {/* Scale */}
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Scale</label>
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              step={0.1}
              value={single.scaleX}
              onChange={(e) => updateObject(single.id, { scaleX: Number(e.target.value) })}
              className="flex-1 bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground"
            />
            <input
              type="number"
              step={0.1}
              value={single.scaleY}
              onChange={(e) => updateObject(single.id, { scaleY: Number(e.target.value) })}
              className="flex-1 bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground"
            />
          </div>
        </div>

        {/* Visibility / Lock */}
        <div className="flex gap-2">
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={single.visible}
              onChange={(e) => updateObject(single.id, { visible: e.target.checked })}
              className="accent-primary"
            />
            Visible
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={single.locked}
              onChange={(e) => updateObject(single.id, { locked: e.target.checked })}
              className="accent-primary"
            />
            Locked
          </label>
        </div>

        {/* Add Keyframe */}
        <button
          onClick={handleAddKeyframe}
          className="w-full py-2 text-[10px] font-mono uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition-colors"
        >
          + Add Keyframe at Current Time
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;
