import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { EFFECT_PRESETS, createEffectFromPreset } from '@/domain/services/effects';
import { v4 as uuid } from 'uuid';
import { Trash2 } from 'lucide-react';

const PropertiesPanel: React.FC = () => {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });
  const updateObject = useEditorStore((s) => s.updateObject);
  const currentTime = useEditorStore((s) => s.currentTime);
  const addKeyframeAtTime = useEditorStore((s) => s.addKeyframeAtTime);
  const clearKeyframes = useEditorStore((s) => s.clearKeyframes);
  const clearAllKeyframes = useEditorStore((s) => s.clearAllKeyframes);
  const addEffect = useEditorStore((s) => s.addEffect);
  const removeEffect = useEditorStore((s) => s.removeEffect);
  const clearEffects = useEditorStore((s) => s.clearEffects);
  const sceneDuration = activeScene.duration;
  const setSceneDuration = useEditorStore((s) => s.setSceneDuration);

  const selectedObjects = selectedIds
    .map((id) => activeScene.objectsById[id])
    .filter(Boolean);
  const single = selectedObjects.length === 1 ? selectedObjects[0] : null;

  const singleKeyframeCount = single
    ? (activeScene.keyframesByObjectId[single.id] || []).length
    : 0;

  const singleEffects = single
    ? (activeScene.effectsByObjectId[single.id] || [])
    : [];

  if (selectedObjects.length === 0) {
    return (
      <div className="h-full bg-panel border-l border-border flex flex-col">
        <div className="px-3 py-3 border-b border-border">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary amber-glow">
            Properties
          </h2>
        </div>
        <div className="px-3 py-3 space-y-3">
          <button
            onClick={clearAllKeyframes}
            className="w-full py-2 text-[10px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors"
          >
            Clear All Keyframes
          </button>
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

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const milli = Math.floor((ms % 1000) / 100);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${milli}`;
  };

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
          <input
            type="number"
            step={0.1}
            min={0.1}
            max={10}
            value={single.scaleX}
            onChange={(e) => {
              const v = Number(e.target.value);
              updateObject(single.id, { scaleX: v, scaleY: v });
            }}
            className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground mt-1"
          />
        </div>

        {/* Visibility / Lock */}
        <div className="flex gap-2">
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={single.visible} onChange={(e) => updateObject(single.id, { visible: e.target.checked })} className="accent-primary" />
            Visible
          </label>
          <label className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={single.locked} onChange={(e) => updateObject(single.id, { locked: e.target.checked })} className="accent-primary" />
            Locked
          </label>
        </div>

        {/* Clear keyframes */}
        {singleKeyframeCount > 0 && (
          <button
            onClick={() => clearKeyframes(single.id)}
            className="w-full py-2 text-[10px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors"
          >
            Clear Keyframes ({singleKeyframeCount})
          </button>
        )}

        {/* === EFFECTS SECTION === */}
        <div className="pt-2 border-t border-border">
          <label className="text-[9px] font-mono uppercase text-muted-foreground">
            Effects ({singleEffects.length})
          </label>

          {singleEffects.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {singleEffects.map((eff) => {
                const preset = EFFECT_PRESETS.find((p) => p.type === eff.type);
                return (
                  <div key={eff.id} className="flex items-center gap-2 p-1.5 bg-muted/50 rounded border border-border text-[9px] font-mono">
                    <span>{preset?.icon || '?'}</span>
                    <span className="flex-1 text-foreground">
                      {preset?.label || eff.type} @ {formatTime(eff.startTime)}
                    </span>
                    <span className="text-muted-foreground">{eff.duration}ms</span>
                    <button
                      onClick={() => removeEffect(single.id, eff.id)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick-add dropdown */}
          <select
            value=""
            onChange={(e) => {
              const idx = Number(e.target.value);
              if (isNaN(idx)) return;
              const preset = EFFECT_PRESETS[idx];
              const effect = createEffectFromPreset(preset, currentTime);
              addEffect(single.id, effect);
            }}
            className="mt-2 w-full bg-muted border border-border rounded px-2 py-1.5 text-[10px] font-mono text-muted-foreground cursor-pointer"
          >
            <option value="">+ Add effect at {formatTime(currentTime)}</option>
            {EFFECT_PRESETS.map((p, i) => (
              <option key={p.type} value={i}>
                {p.icon} {p.label} — {p.description}
              </option>
            ))}
          </select>

          {singleEffects.length > 0 && (
            <button
              onClick={() => clearEffects(single.id)}
              className="mt-1.5 w-full py-1.5 text-[9px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors"
            >
              Clear All Effects
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
