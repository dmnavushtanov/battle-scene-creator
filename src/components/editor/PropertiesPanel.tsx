import React, { useState, useRef, useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { EFFECT_PRESETS, createEffectFromPreset } from '@/domain/services/effects';
import { v4 as uuid } from 'uuid';
import { Trash2, Users, ChevronRight, X, Plus, Minus, Mic, Square, Play as PlayIcon } from 'lucide-react';
import type { NarrationEvent, OverlayEvent, TextAnimation, OverlayTransition } from '@/domain/models';

const formatTime = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const milli = Math.floor((ms % 1000) / 100);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${milli}`;
};

/* ============ Narration Editor ============ */
const NarrationEditor: React.FC = () => {
  const selectedNarrationId = useEditorStore((s) => s.selectedNarrationId);
  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });
  const updateNarration = useEditorStore((s) => s.updateNarration);
  const removeNarration = useEditorStore((s) => s.removeNarration);
  const setSelectedNarrationId = useEditorStore((s) => s.setSelectedNarrationId);

  const narration = activeScene.narrationEvents.find((n) => n.id === selectedNarrationId);

  // Voice recording state
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  if (!narration) return null;

  const update = (updates: Partial<NarrationEvent>) => updateNarration(narration.id, updates);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => update({ audioUrl: reader.result as string });
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsVoiceRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Could not access microphone. Please allow microphone permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsVoiceRecording(false);
  };

  return (
    <div className="h-full bg-panel border-l border-border flex flex-col">
      <div className="px-3 py-3 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-accent">
          📝 Narration
        </h2>
        <button onClick={() => setSelectedNarrationId(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
      </div>
      <div className="px-3 py-3 flex-1 overflow-y-auto scrollbar-tactical space-y-3">
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Text</label>
          <textarea
            value={narration.text || ''}
            onChange={(e) => update({ text: e.target.value })}
            rows={3}
            className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground resize-none"
            placeholder="Enter narration text..."
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[8px] font-mono text-muted-foreground">Start (sec)</label>
            <input type="number" step={0.1} value={+(narration.startTime / 1000).toFixed(1)} onChange={(e) => update({ startTime: Number(e.target.value) * 1000 })} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" />
          </div>
          <div>
            <label className="text-[8px] font-mono text-muted-foreground">Duration (sec)</label>
            <input type="number" step={0.1} value={+(narration.duration / 1000).toFixed(1)} onChange={(e) => update({ duration: Number(e.target.value) * 1000 })} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Position</label>
          <select value={narration.position} onChange={(e) => update({ position: e.target.value as NarrationEvent['position'] })} className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground">
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[8px] font-mono text-muted-foreground">Font Size</label>
            <input type="number" value={narration.fontSize} onChange={(e) => update({ fontSize: Number(e.target.value) })} min={10} max={72} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" />
          </div>
          <div>
            <label className="text-[8px] font-mono text-muted-foreground">Font Style</label>
            <select value={narration.fontStyle} onChange={(e) => update({ fontStyle: e.target.value as NarrationEvent['fontStyle'] })} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground">
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="italic">Italic</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Animation</label>
          <select value={narration.textAnimation} onChange={(e) => update({ textAnimation: e.target.value as TextAnimation })} className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground">
            <option value="fade">Fade</option>
            <option value="typewriter">Typewriter</option>
            <option value="slide-up">Slide Up</option>
            <option value="none">None</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[8px] font-mono text-muted-foreground">Text Color</label>
            <input type="color" value={narration.textColor} onChange={(e) => update({ textColor: e.target.value })} className="w-full h-7 bg-muted border border-border rounded cursor-pointer" />
          </div>
          <div>
            <label className="text-[8px] font-mono text-muted-foreground">BG Opacity</label>
            <input type="number" value={narration.bgOpacity} onChange={(e) => update({ bgOpacity: Number(e.target.value) })} min={0} max={1} step={0.1} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" />
          </div>
        </div>

        {/* Voice Recording Section */}
        <div className="pt-2 border-t border-border">
          <label className="text-[9px] font-mono uppercase text-muted-foreground flex items-center gap-1">
            <Mic size={10} /> Voice Recording
          </label>
          <div className="mt-1.5 space-y-2">
            {narration.audioUrl ? (
              <div className="space-y-1.5">
                <audio src={narration.audioUrl} controls className="w-full h-8" style={{ colorScheme: 'dark' }} />
                <button
                  onClick={() => update({ audioUrl: undefined })}
                  className="w-full py-1.5 text-[9px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors"
                >
                  Remove Recording
                </button>
              </div>
            ) : (
              <button
                onClick={isVoiceRecording ? stopVoiceRecording : startVoiceRecording}
                className={`w-full py-2 text-[10px] font-mono uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors border ${
                  isVoiceRecording
                    ? 'bg-destructive/20 text-destructive border-destructive/50 animate-pulse'
                    : 'bg-muted text-foreground border-border hover:bg-muted/80'
                }`}
              >
                {isVoiceRecording ? <Square size={12} /> : <Mic size={12} />}
                {isVoiceRecording ? 'Stop Recording' : 'Record Voice'}
              </button>
            )}
            <p className="text-[8px] font-mono text-muted-foreground">
              {narration.audioUrl ? 'Audio will play at narration start time.' : 'Record narration audio to play during the timeline.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => { removeNarration(narration.id); setSelectedNarrationId(null); }}
          className="w-full py-2 text-[10px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors"
        >
          Delete Narration
        </button>
      </div>
    </div>
  );
};

/* ============ Overlay Editor ============ */
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
        <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-secondary-foreground">
          🖼️ Overlay
        </h2>
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
              <option value="center">Center</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
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
            <option value="blur">Blur</option>
            <option value="dim">Dim</option>
            <option value="blur+dim">Blur + Dim</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Transition</label>
          <select value={overlay.transition} onChange={(e) => update({ transition: e.target.value as OverlayTransition })} className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground">
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="none">None</option>
          </select>
        </div>
        <div>
          <label className="text-[8px] font-mono text-muted-foreground">Dim Opacity</label>
          <input type="number" value={overlay.dimOpacity} onChange={(e) => update({ dimOpacity: Number(e.target.value) })} min={0} max={1} step={0.1} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" />
        </div>
        <button
          onClick={() => { removeOverlay(overlay.id); setSelectedOverlayId(null); }}
          className="w-full py-2 text-[10px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors"
        >
          Delete Overlay
        </button>
      </div>
    </div>
  );
};

/* ============ Group Management ============ */
const GroupSection: React.FC<{ selectedIds: string[] }> = ({ selectedIds }) => {
  const [groupName, setGroupName] = useState('');
  const createGroup = useEditorStore((s) => s.createGroup);
  const deleteGroup = useEditorStore((s) => s.deleteGroup);
  const selectGroup = useEditorStore((s) => s.selectGroup);
  const removeFromGroup = useEditorStore((s) => s.removeFromGroup);
  const addToGroup = useEditorStore((s) => s.addToGroup);
  const getGroupForObject = useEditorStore((s) => s.getGroupForObject);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });

  const groups = activeScene.groups || {};
  const existingGroup = selectedIds.length === 1 ? getGroupForObject(selectedIds[0]) : null;

  // Check if all selected are in the same group
  const allInSameGroup = selectedIds.length > 1 && (() => {
    const g = getGroupForObject(selectedIds[0]);
    if (!g) return false;
    return selectedIds.every((id) => g.memberIds.includes(id));
  })();

  const sameGroup = allInSameGroup ? getGroupForObject(selectedIds[0]) : null;

  const handleCreateGroup = () => {
    const name = groupName.trim() || `Group ${Object.keys(groups).length + 1}`;
    createGroup(name, selectedIds);
    setGroupName('');
  };

  const getObjectLabel = (objId: string) => {
    const obj = activeScene.objectsById[objId];
    if (!obj) return objId.slice(0, 6);
    return obj.label || obj.unitType || obj.type;
  };

  return (
    <div className="pt-2 border-t border-border space-y-2">
      <label className="text-[9px] font-mono uppercase text-muted-foreground flex items-center gap-1">
        <Users size={10} /> Groups
      </label>

      {/* Show existing group info for single selection */}
      {existingGroup && (
        <div className="p-2 bg-muted/50 rounded border border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: existingGroup.color }} />
            <span className="text-[10px] font-mono font-semibold text-foreground">{existingGroup.name}</span>
            <span className="text-[8px] font-mono text-muted-foreground">{existingGroup.memberIds.length} members</span>
          </div>
          {/* Members list */}
          <div className="space-y-0.5">
            <span className="text-[8px] font-mono text-muted-foreground uppercase">Members:</span>
            {existingGroup.memberIds.map((mid) => (
              <div key={mid} className="flex items-center gap-1.5 pl-1">
                <span className={`text-[9px] font-mono ${mid === selectedIds[0] ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {getObjectLabel(mid)}
                </span>
                <button
                  onClick={() => setSelectedIds([mid])}
                  className="text-[8px] font-mono text-muted-foreground hover:text-primary transition-colors"
                  title="Select this unit"
                >
                  ◎
                </button>
                <button
                  onClick={() => removeFromGroup(existingGroup.id, [mid])}
                  className="text-[8px] text-destructive/60 hover:text-destructive transition-colors ml-auto"
                  title="Remove from group"
                >
                  <Minus size={8} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => selectGroup(existingGroup.id)} className="flex-1 py-1 text-[9px] font-mono uppercase bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors">
              Select All
            </button>
            <button onClick={() => deleteGroup(existingGroup.id)} className="flex-1 py-1 text-[9px] font-mono uppercase bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors">
              Ungroup
            </button>
          </div>
        </div>
      )}

      {/* Multi-select same group */}
      {sameGroup && (
        <div className="p-2 bg-muted/50 rounded border border-border space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sameGroup.color }} />
            <span className="text-[10px] font-mono font-semibold text-foreground">{sameGroup.name}</span>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => selectGroup(sameGroup.id)} className="flex-1 py-1 text-[9px] font-mono uppercase bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors">
              Select All
            </button>
            <button onClick={() => deleteGroup(sameGroup.id)} className="flex-1 py-1 text-[9px] font-mono uppercase bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors">
              Ungroup
            </button>
          </div>
        </div>
      )}

      {/* Multi-select: create group or add to existing */}
      {selectedIds.length > 1 && !allInSameGroup && (
        <div className="space-y-1.5">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              className="flex-1 bg-muted border border-border rounded px-2 py-1 text-[10px] font-mono text-foreground"
            />
            <button onClick={handleCreateGroup} className="px-3 py-1 text-[9px] font-mono uppercase bg-primary/20 text-primary border border-primary/30 rounded hover:bg-primary/30 transition-colors">
              Create
            </button>
          </div>
          {/* Add to existing group */}
          {Object.keys(groups).length > 0 && (
            <div className="space-y-1">
              <span className="text-[8px] font-mono text-muted-foreground">Or add to existing:</span>
              {Object.values(groups).map((g) => (
                <button
                  key={g.id}
                  onClick={() => addToGroup(g.id, selectedIds)}
                  className="w-full flex items-center gap-2 p-1.5 text-[9px] font-mono bg-muted/30 border border-border rounded hover:bg-muted/60 transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                  <span className="text-foreground">{g.name}</span>
                  <Plus size={8} className="ml-auto text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show all groups for quick access */}
      {selectedIds.length <= 1 && !existingGroup && Object.keys(groups).length > 0 && (
        <div className="space-y-1">
          {Object.values(groups).map((g) => (
            <button
              key={g.id}
              onClick={() => selectGroup(g.id)}
              className="w-full flex items-center gap-2 p-1.5 text-[9px] font-mono bg-muted/30 border border-border rounded hover:bg-muted/60 transition-colors"
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
              <span className="text-foreground">{g.name}</span>
              <span className="text-muted-foreground ml-auto">{g.memberIds.length}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============ Main Properties Panel ============ */
const PropertiesPanel: React.FC = () => {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selectedNarrationId = useEditorStore((s) => s.selectedNarrationId);
  const selectedOverlayId = useEditorStore((s) => s.selectedOverlayId);
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

  // Show narration/overlay editors when selected
  if (selectedNarrationId) return <NarrationEditor />;
  if (selectedOverlayId) return <OverlayEditor />;

  const selectedObjects = selectedIds.map((id) => activeScene.objectsById[id]).filter(Boolean);
  const single = selectedObjects.length === 1 ? selectedObjects[0] : null;
  const singleKeyframeCount = single ? (activeScene.keyframesByObjectId[single.id] || []).length : 0;
  const singleEffects = single ? (activeScene.effectsByObjectId[single.id] || []) : [];

  if (selectedObjects.length === 0) {
    return (
      <div className="h-full bg-panel border-l border-border flex flex-col">
        <div className="px-3 py-3 border-b border-border">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary amber-glow">Properties</h2>
        </div>
        <div className="px-3 py-3 space-y-3">
          <button onClick={clearAllKeyframes} className="w-full py-2 text-[10px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors">
            Clear All Keyframes
          </button>
          <GroupSection selectedIds={[]} />
        </div>
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-[10px] font-mono text-muted-foreground text-center">
            Select an object to view its properties.<br />
            <span className="text-[8px]">Click narration/overlay blocks on the timeline to edit them.</span>
          </p>
        </div>
      </div>
    );
  }

  if (!single) {
    return (
      <div className="h-full bg-panel border-l border-border flex flex-col">
        <div className="px-3 py-3 border-b border-border">
          <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary amber-glow">Properties</h2>
        </div>
        <div className="px-3 py-3 flex-1 overflow-y-auto scrollbar-tactical space-y-3">
          <p className="text-[10px] font-mono text-muted-foreground">{selectedObjects.length} objects selected</p>
          <GroupSection selectedIds={selectedIds} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-panel border-l border-border flex flex-col">
      <div className="px-3 py-3 border-b border-border">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary amber-glow">Properties</h2>
      </div>
      <div className="px-3 py-3 flex-1 overflow-y-auto scrollbar-tactical space-y-3">
        {/* Type badge */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-primary/20 text-primary rounded">
            {single.unitType || single.type}
          </span>
          {single.label && <span className="text-[9px] font-mono text-muted-foreground">{single.label}</span>}
        </div>

        {/* Label edit */}
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Label</label>
          <input type="text" value={single.label || ''} onChange={(e) => updateObject(single.id, { label: e.target.value })} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground mt-1" placeholder="Unit label..." />
        </div>

        {/* Position */}
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Position</label>
          <div className="flex gap-2 mt-1">
            <div className="flex-1">
              <label className="text-[8px] font-mono text-muted-foreground">X</label>
              <input type="number" value={Math.round(single.x)} onChange={(e) => updateObject(single.id, { x: Number(e.target.value) })} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" />
            </div>
            <div className="flex-1">
              <label className="text-[8px] font-mono text-muted-foreground">Y</label>
              <input type="number" value={Math.round(single.y)} onChange={(e) => updateObject(single.id, { y: Number(e.target.value) })} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground" />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Rotation</label>
          <input type="number" value={Math.round(single.rotation)} onChange={(e) => updateObject(single.id, { rotation: Number(e.target.value) })} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground mt-1" />
        </div>

        {/* Scale */}
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Scale</label>
          <input type="number" step={0.1} min={0.1} max={10} value={single.scaleX} onChange={(e) => { const v = Number(e.target.value); updateObject(single.id, { scaleX: v, scaleY: v }); }} className="w-full bg-muted border border-border rounded px-2 py-1 text-xs font-mono text-foreground mt-1" />
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
          <button onClick={() => clearKeyframes(single.id)} className="w-full py-2 text-[10px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors">
            Clear Keyframes ({singleKeyframeCount})
          </button>
        )}

        {/* === EFFECTS SECTION === */}
        <div className="pt-2 border-t border-border">
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Effects ({singleEffects.length})</label>
          {singleEffects.length > 0 && (
            <div className="mt-1.5 space-y-1">
              {singleEffects.map((eff) => {
                const preset = EFFECT_PRESETS.find((p) => p.type === eff.type);
                return (
                  <div key={eff.id} className="flex items-center gap-2 p-1.5 bg-muted/50 rounded border border-border text-[9px] font-mono">
                    <span>{preset?.icon || '?'}</span>
                    <span className="flex-1 text-foreground">{preset?.label || eff.type} @ {formatTime(eff.startTime)}</span>
                    <span className="text-muted-foreground">{(eff.duration / 1000).toFixed(1)}s</span>
                    <button onClick={() => removeEffect(single.id, eff.id)} className="text-destructive hover:text-destructive/80 transition-colors">
                      <Trash2 size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
              <option key={p.type} value={i}>{p.icon} {p.label} — {p.description}</option>
            ))}
          </select>
          {singleEffects.length > 0 && (
            <button onClick={() => clearEffects(single.id)} className="mt-1.5 w-full py-1.5 text-[9px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors">
              Clear All Effects
            </button>
          )}
        </div>

        {/* Groups */}
        <GroupSection selectedIds={selectedIds} />
      </div>
    </div>
  );
};

export default PropertiesPanel;
