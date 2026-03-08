import React, { useState } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { Trash2, MapPin } from 'lucide-react';
import { formatTimeSec } from '@/domain/formatters';

const KeyframeEditor: React.FC<{ objectId: string }> = ({ objectId }) => {
  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });
  const selectedKeyframeIndex = useEditorStore((s) => s.selectedKeyframeIndex);
  const setSelectedKeyframeIndex = useEditorStore((s) => s.setSelectedKeyframeIndex);
  const updateKeyframe = useEditorStore((s) => s.updateKeyframe);
  const removeKeyframe = useEditorStore((s) => s.removeKeyframe);

  const keyframes = activeScene.keyframesByObjectId[objectId] || [];
  const selectedIdx = selectedKeyframeIndex?.objectId === objectId ? selectedKeyframeIndex.index : null;
  const selectedKf = selectedIdx !== null && selectedIdx < keyframes.length ? keyframes[selectedIdx] : null;

  return (
    <div className="mt-1.5 space-y-1">
      <div className="max-h-24 overflow-y-auto scrollbar-tactical space-y-0.5">
        {keyframes.map((kf, idx) => {
          const isSel = selectedIdx === idx;
          return (
            <div
              key={idx}
              className={`flex items-center gap-1 p-1 rounded border text-[8px] font-mono cursor-pointer transition-colors ${
                isSel ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted/30 hover:bg-muted/50'
              }`}
              onClick={() => setSelectedKeyframeIndex({ objectId, index: idx })}
            >
              <MapPin size={8} className="text-primary flex-shrink-0" />
              <span className="text-foreground">{formatTimeSec(kf.time)}</span>
              <span className="text-muted-foreground">({Math.round(kf.x)}, {Math.round(kf.y)})</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeKeyframe(objectId, idx); }}
                className="ml-auto text-destructive/60 hover:text-destructive transition-colors"
              >
                <Trash2 size={8} />
              </button>
            </div>
          );
        })}
      </div>
      {selectedKf && selectedIdx !== null && (
        <div className="p-1.5 bg-muted/50 rounded border border-primary/20 space-y-1">
          <p className="text-[8px] font-mono uppercase text-primary">Keyframe #{selectedIdx + 1}</p>
          <div className="grid grid-cols-3 gap-1">
            <div>
              <label className="text-[7px] font-mono text-muted-foreground">Time (s)</label>
              <input type="number" step={0.1} value={+(selectedKf.time / 1000).toFixed(2)}
                onChange={(e) => updateKeyframe(objectId, selectedIdx, { time: Number(e.target.value) * 1000 })}
                className="w-full bg-muted border border-border rounded px-1 py-0.5 text-[9px] font-mono text-foreground" />
            </div>
            <div>
              <label className="text-[7px] font-mono text-muted-foreground">X</label>
              <input type="number" value={Math.round(selectedKf.x)}
                onChange={(e) => updateKeyframe(objectId, selectedIdx, { x: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded px-1 py-0.5 text-[9px] font-mono text-foreground" />
            </div>
            <div>
              <label className="text-[7px] font-mono text-muted-foreground">Y</label>
              <input type="number" value={Math.round(selectedKf.y)}
                onChange={(e) => updateKeyframe(objectId, selectedIdx, { y: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded px-1 py-0.5 text-[9px] font-mono text-foreground" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div>
              <label className="text-[7px] font-mono text-muted-foreground">Rotation</label>
              <input type="number" value={Math.round(selectedKf.rotation)}
                onChange={(e) => updateKeyframe(objectId, selectedIdx, { rotation: Number(e.target.value) })}
                className="w-full bg-muted border border-border rounded px-1 py-0.5 text-[9px] font-mono text-foreground" />
            </div>
            <div>
              <label className="text-[7px] font-mono text-muted-foreground">Scale</label>
              <input type="number" step={0.1} value={selectedKf.scaleX}
                onChange={(e) => { const v = Number(e.target.value); updateKeyframe(objectId, selectedIdx, { scaleX: v, scaleY: v }); }}
                className="w-full bg-muted border border-border rounded px-1 py-0.5 text-[9px] font-mono text-foreground" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyframeEditor;
