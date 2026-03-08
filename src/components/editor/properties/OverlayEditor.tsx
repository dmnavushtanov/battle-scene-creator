import React from 'react';
import { useEditorStore } from '@/store/editorStore';
import { X } from 'lucide-react';
import type { OverlayEvent, OverlayTransition } from '@/domain/models';

const OverlayEditor: React.FC = () => {
  const selectedOverlayId = useEditorStore((s) => s.selectedOverlayId);
  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });
  const updateOverlay = useEditorStore((s) => s.updateOverlay);
  const removeOverlay = useEditorStore((s) => s.removeOverlay);
  const setSelectedOverlayId = useEditorStore((s) => s.setSelectedOverlayId);

  const overlay = activeScene.overlayEvents.find((o) => o.id === selectedOverlayId);
  if (!overlay) return null;

  const update = (updates: Partial<OverlayEvent>) => updateOverlay(overlay.id, updates);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ imageUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="h-full bg-panel border-l border-border flex flex-col">
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-secondary-foreground">🖼️ Overlay</h2>
        <button onClick={() => setSelectedOverlayId(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
      </div>
      <div className="px-3 py-3 flex-1 overflow-y-auto scrollbar-tactical space-y-3">
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Image</label>
          {overlay.imageUrl && <img src={overlay.imageUrl} alt="" className="w-full h-20 object-contain bg-muted rounded mt-1 mb-1" />}
          <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-[10px] font-mono text-muted-foreground mt-1" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[8px] font-mono text-muted-foreground">Start (sec)</label>
            <input type="number" step={0.1} value={+(overlay.startTime / 1000).toFixed(1)} onChange={(e) => update({ startTime: Number(e.target.value) * 1000 })} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" />
          </div>
          <div>
            <label className="text-[8px] font-mono text-muted-foreground">Duration (sec)</label>
            <input type="number" step={0.1} value={+(overlay.duration / 1000).toFixed(1)} onChange={(e) => update({ duration: Number(e.target.value) * 1000 })} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Title</label>
          <input type="text" value={overlay.title || ''} onChange={(e) => update({ title: e.target.value })} className="w-full mt-1 bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" placeholder="Title..." />
        </div>
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Subtitle</label>
          <input type="text" value={overlay.subtitle || ''} onChange={(e) => update({ subtitle: e.target.value })} className="w-full mt-1 bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" placeholder="Subtitle..." />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[8px] font-mono text-muted-foreground">Position</label>
            <select value={overlay.imagePosition} onChange={(e) => update({ imagePosition: e.target.value as OverlayEvent['imagePosition'] })} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground">
              <option value="center">Center</option><option value="left">Left</option><option value="right">Right</option>
            </select>
          </div>
          <div>
            <label className="text-[8px] font-mono text-muted-foreground">Scale</label>
            <input type="number" value={overlay.imageScale} onChange={(e) => update({ imageScale: Number(e.target.value) })} step={0.1} min={0.1} max={3} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Background Effect</label>
          <select value={overlay.backgroundEffect} onChange={(e) => update({ backgroundEffect: e.target.value as OverlayEvent['backgroundEffect'] })} className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground">
            <option value="blur">Blur</option><option value="dim">Dim</option><option value="blur+dim">Blur + Dim</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Transition</label>
          <select value={overlay.transition} onChange={(e) => update({ transition: e.target.value as OverlayTransition })} className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground">
            <option value="fade">Fade</option><option value="slide">Slide</option><option value="none">None</option>
          </select>
        </div>
        <div>
          <label className="text-[8px] font-mono text-muted-foreground">Dim Opacity</label>
          <input type="number" value={overlay.dimOpacity} onChange={(e) => update({ dimOpacity: Number(e.target.value) })} min={0} max={1} step={0.1} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" />
        </div>
        <button onClick={() => { removeOverlay(overlay.id); setSelectedOverlayId(null); }}
          className="w-full py-2 text-[10px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors">
          Delete Overlay
        </button>
      </div>
    </div>
  );
};

export default OverlayEditor;
