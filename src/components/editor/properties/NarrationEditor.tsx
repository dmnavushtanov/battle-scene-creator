import React, { useState, useRef } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { X, Mic, Square } from 'lucide-react';
import type { NarrationEvent, TextAnimation } from '@/domain/models';

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
        reader.onload = () => {
          const audioUrl = reader.result as string;
          // Auto-set narration duration to match voice recording length
          const audio = new Audio(audioUrl);
          audio.onloadedmetadata = () => {
            const audioDurMs = Math.ceil(audio.duration * 1000);
            update({ audioUrl, duration: audioDurMs });
          };
          audio.onerror = () => update({ audioUrl });
        };
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
        <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-accent">📝 Narration</h2>
        <button onClick={() => setSelectedNarrationId(null)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
      </div>
      <div className="px-3 py-3 flex-1 overflow-y-auto scrollbar-tactical space-y-3">
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Text</label>
          <textarea value={narration.text || ''} onChange={(e) => update({ text: e.target.value })} rows={3}
            className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground resize-none" placeholder="Enter narration text..." />
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
            <option value="top">Top</option><option value="center">Center</option><option value="bottom">Bottom</option>
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
              <option value="normal">Normal</option><option value="bold">Bold</option><option value="italic">Italic</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-[9px] font-mono uppercase text-muted-foreground">Animation</label>
          <select value={narration.textAnimation} onChange={(e) => update({ textAnimation: e.target.value as TextAnimation })} className="w-full mt-1 bg-muted border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground">
            <option value="fade">Fade</option><option value="typewriter">Typewriter</option><option value="slide-up">Slide Up</option><option value="none">None</option>
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

        {/* Voice Recording */}
        <div className="pt-2 border-t border-border">
          <label className="text-[9px] font-mono uppercase text-muted-foreground flex items-center gap-1"><Mic size={10} /> Voice Recording</label>
          <div className="mt-1.5 space-y-2">
            {narration.audioUrl ? (
              <div className="space-y-1.5">
                <audio src={narration.audioUrl} controls className="w-full h-8" style={{ colorScheme: 'dark' }} />
                <button onClick={() => update({ audioUrl: undefined })} className="w-full py-1.5 text-[9px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors">
                  Remove Recording
                </button>
              </div>
            ) : (
              <button onClick={isVoiceRecording ? stopVoiceRecording : startVoiceRecording}
                className={`w-full py-2 text-[10px] font-mono uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-colors border ${
                  isVoiceRecording ? 'bg-destructive/20 text-destructive border-destructive/50 animate-pulse' : 'bg-muted text-foreground border-border hover:bg-muted/80'
                }`}>
                {isVoiceRecording ? <Square size={12} /> : <Mic size={12} />}
                {isVoiceRecording ? 'Stop Recording' : 'Record Voice'}
              </button>
            )}
            <p className="text-[8px] font-mono text-muted-foreground">
              {narration.audioUrl ? 'Audio will play at narration start time.' : 'Record narration audio to play during the timeline.'}
            </p>
          </div>
        </div>

        <button onClick={() => { removeNarration(narration.id); setSelectedNarrationId(null); }}
          className="w-full py-2 text-[10px] font-mono uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30 rounded hover:bg-destructive/20 transition-colors">
          Delete Narration
        </button>
      </div>
    </div>
  );
};

export default NarrationEditor;
