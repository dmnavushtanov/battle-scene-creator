import React, { useState, useRef, useEffect } from 'react';
import Toolbar from '@/components/editor/Toolbar';
import AssetLibrary from '@/components/editor/AssetLibrary';
import MapCanvas from '@/components/editor/MapCanvas';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import TimelinePanel from '@/components/editor/TimelinePanel';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const NarrationOverlay: React.FC = () => {
  const activeNarrations = useEditorStore((s) => s.activeNarrations);
  const activeOverlay = useEditorStore((s) => s.activeOverlay);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const currentTime = useEditorStore((s) => s.currentTime);
  const selectedOverlayId = useEditorStore((s) => s.selectedOverlayId);

  const activeScene = useEditorStore((s) => {
    const scene = s.project.scenes.find((sc) => sc.id === s.activeSceneId);
    return scene || s.project.scenes[0];
  });
  const editingOverlay = !isPlaying && selectedOverlayId
    ? activeScene.overlayEvents.find((o) => o.id === selectedOverlayId) || null
    : null;

  const showPlaybackOverlay = isPlaying ? activeOverlay : null;
  const overlayToShow = showPlaybackOverlay || editingOverlay;

  if (!isPlaying && !editingOverlay && activeNarrations.length === 0) return null;

  const positionMap: Record<string, React.CSSProperties> = {
    top: { top: 40, left: '50%', transform: 'translateX(-50%)' },
    bottom: { bottom: 60, left: '50%', transform: 'translateX(-50%)' },
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  };

  return (
    <>
      {overlayToShow && (
        <div className="absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-500">
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayToShow.dimOpacity})`, backdropFilter: overlayToShow.backgroundEffect.includes('blur') ? 'blur(8px)' : undefined }} />
          <div className="relative z-10 flex flex-col items-center gap-4 max-w-lg" style={{ alignSelf: overlayToShow.imagePosition === 'left' ? 'flex-start' : overlayToShow.imagePosition === 'right' ? 'flex-end' : 'center' }}>
            {overlayToShow.imageUrl && (
              <img src={overlayToShow.imageUrl} alt={overlayToShow.title || ''} className="rounded-lg border-2 border-primary/30 shadow-lg max-h-64 object-contain" style={{ transform: `scale(${overlayToShow.imageScale})` }} />
            )}
            {overlayToShow.title && <h2 className="font-mono text-xl font-bold text-primary amber-glow text-center">{overlayToShow.title}</h2>}
            {overlayToShow.subtitle && <p className="font-mono text-sm text-foreground/80 text-center">{overlayToShow.subtitle}</p>}
          </div>
          {!isPlaying && editingOverlay && (
            <div className="absolute top-2 left-2 z-40 px-2 py-1 bg-accent/80 rounded text-[9px] font-mono text-accent-foreground">
              OVERLAY PREVIEW
            </div>
          )}
        </div>
      )}

      {isPlaying && activeNarrations.map((n) => {
        if (!n.text) return null;
        const progress = Math.min(1, (currentTime - n.startTime) / Math.max(n.duration, 1));
        const fadeEnd = Math.max(0, 1 - (currentTime - n.startTime - n.duration + 500) / 500);
        let opacity = 1;
        if (n.textAnimation === 'fade') {
          const fadeIn = Math.min(1, (currentTime - n.startTime) / 300);
          opacity = Math.min(fadeIn, fadeEnd);
        }
        const posStyle = n.position === 'custom'
          ? { left: n.customX || 100, top: n.customY || 100 }
          : positionMap[n.position] || positionMap.bottom;

        return (
          <div key={n.id} className="absolute z-40 pointer-events-none max-w-2xl px-6 py-3 rounded-lg" style={{ ...posStyle, opacity, backgroundColor: n.bgOpacity > 0 ? `rgba(0,0,0,${n.bgOpacity})` : undefined }}>
            <p className="font-mono text-center whitespace-pre-wrap" style={{ fontSize: n.fontSize, fontWeight: n.fontStyle === 'bold' ? 700 : 400, fontStyle: n.fontStyle === 'italic' ? 'italic' : 'normal', color: n.textColor }}>
              {n.textAnimation === 'typewriter' ? n.text.slice(0, Math.floor(n.text.length * progress)) : n.text}
            </p>
          </div>
        );
      })}
    </>
  );
};

const Index: React.FC = () => {
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-panel border-b border-border">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-mono font-bold text-primary amber-glow tracking-wider uppercase">Battle Map</h1>
          <span className="text-[9px] font-mono px-2 py-0.5 bg-muted text-muted-foreground rounded uppercase">MVP</span>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar />

      {/* Main content: vertical resizable between editor area and timeline */}
      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={75} minSize={40}>
          {/* Main editor area */}
          <div className="flex h-full relative">
            {/* Left: Asset Library */}
            {leftPanelOpen && (
              <div className="w-52 flex-shrink-0 overflow-y-auto">
                <AssetLibrary />
              </div>
            )}

            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              title={leftPanelOpen ? 'Hide asset library' : 'Show asset library'}
              className={`absolute top-1/2 -translate-y-1/2 z-20 h-14 w-6 border border-border bg-panel text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${
                leftPanelOpen ? 'left-52 rounded-r-md border-l-0' : 'left-0 rounded-r-md'
              }`}
            >
              {leftPanelOpen ? <PanelLeftClose size={14} className="mx-auto" /> : <PanelLeftOpen size={14} className="mx-auto" />}
            </button>

            {/* Center: Canvas + Overlays */}
            <div className="flex-1 relative overflow-hidden">
              <MapCanvas />
              <NarrationOverlay />
            </div>

            {/* Right panel collapse button - always visible outside the panel */}
            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              title={rightPanelOpen ? 'Hide properties panel' : 'Show properties panel'}
              className={`absolute top-1/2 -translate-y-1/2 z-20 h-14 w-6 border border-border bg-panel text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${
                rightPanelOpen ? 'right-72 rounded-l-md border-r-0' : 'right-0 rounded-l-md'
              }`}
            >
              {rightPanelOpen ? <PanelRightClose size={14} className="mx-auto" /> : <PanelRightOpen size={14} className="mx-auto" />}
            </button>

            {/* Right: Properties Panel */}
            {rightPanelOpen && (
              <div className="w-72 flex-shrink-0 overflow-y-auto">
                <PropertiesPanel />
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Bottom: Timeline - resizable */}
        <ResizablePanel defaultSize={25} minSize={12} maxSize={50}>
          <TimelinePanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
