import React, { useState, useRef } from 'react';
import Toolbar from '@/components/editor/Toolbar';
import AssetLibrary from '@/components/editor/AssetLibrary';
import MapCanvas from '@/components/editor/MapCanvas';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import TimelinePanel from '@/components/editor/TimelinePanel';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

const NarrationOverlay: React.FC = () => {
  const activeNarrations = useEditorStore((s) => s.activeNarrations);
  const activeOverlay = useEditorStore((s) => s.activeOverlay);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const currentTime = useEditorStore((s) => s.currentTime);

  if (!isPlaying) return null;

  const positionMap: Record<string, React.CSSProperties> = {
    top: { top: 40, left: '50%', transform: 'translateX(-50%)' },
    bottom: { bottom: 60, left: '50%', transform: 'translateX(-50%)' },
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  };

  return (
    <>
      {/* Overlay event: blur + dim + portrait */}
      {activeOverlay && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center transition-opacity duration-500"
          style={{ opacity: activeOverlay.transition === 'fade' ? 1 : 1 }}
        >
          {/* Dim/Blur background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: `rgba(0,0,0,${activeOverlay.dimOpacity})`,
              backdropFilter: activeOverlay.backgroundEffect.includes('blur') ? 'blur(8px)' : undefined,
            }}
          />
          {/* Content */}
          <div
            className="relative z-10 flex flex-col items-center gap-4 max-w-lg"
            style={{
              alignSelf: activeOverlay.imagePosition === 'left' ? 'flex-start' : activeOverlay.imagePosition === 'right' ? 'flex-end' : 'center',
            }}
          >
            {activeOverlay.imageUrl && (
              <img
                src={activeOverlay.imageUrl}
                alt={activeOverlay.title || ''}
                className="rounded-lg border-2 border-primary/30 shadow-lg max-h-64 object-contain"
                style={{ transform: `scale(${activeOverlay.imageScale})` }}
              />
            )}
            {activeOverlay.title && (
              <h2 className="font-mono text-xl font-bold text-primary amber-glow text-center">
                {activeOverlay.title}
              </h2>
            )}
            {activeOverlay.subtitle && (
              <p className="font-mono text-sm text-foreground/80 text-center">
                {activeOverlay.subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Narration text overlays */}
      {activeNarrations.map((n) => {
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
          <div
            key={n.id}
            className="absolute z-40 pointer-events-none max-w-2xl px-6 py-3 rounded-lg"
            style={{
              ...posStyle,
              opacity,
              backgroundColor: n.bgOpacity > 0 ? `rgba(0,0,0,${n.bgOpacity})` : undefined,
            }}
          >
            <p
              className="font-mono text-center whitespace-pre-wrap"
              style={{
                fontSize: n.fontSize,
                fontWeight: n.fontStyle === 'bold' ? 700 : 400,
                fontStyle: n.fontStyle === 'italic' ? 'italic' : 'normal',
                color: n.textColor,
              }}
            >
              {n.textAnimation === 'typewriter'
                ? n.text.slice(0, Math.floor(n.text.length * progress))
                : n.text}
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
          <h1 className="text-sm font-mono font-bold text-primary amber-glow tracking-wider uppercase">
            Battle Map
          </h1>
          <span className="text-[9px] font-mono px-2 py-0.5 bg-muted text-muted-foreground rounded uppercase">
            MVP
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar />

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left: Asset Library */}
        {leftPanelOpen && (
          <div className="w-52 flex-shrink-0">
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
        <div className="flex-1 relative">
          <MapCanvas />
          <NarrationOverlay />
        </div>

        {rightPanelOpen && (
          <div className="w-64 flex-shrink-0 relative">
            <button
              onClick={() => setRightPanelOpen(false)}
              title="Hide properties panel"
              className="absolute top-1/2 -translate-y-1/2 -left-6 z-20 h-14 w-6 border border-border border-r-0 bg-panel text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-l-md"
            >
              <PanelRightClose size={14} className="mx-auto" />
            </button>
            <PropertiesPanel />
          </div>
        )}
        {!rightPanelOpen && (
          <button
            onClick={() => setRightPanelOpen(true)}
            title="Show properties panel"
            className="absolute top-1/2 -translate-y-1/2 right-0 z-20 h-14 w-6 border border-border bg-panel text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-l-md"
          >
            <PanelRightOpen size={14} className="mx-auto" />
          </button>
        )}
      </div>

      {/* Bottom: Timeline */}
      <div className="h-44 flex-shrink-0">
        <TimelinePanel />
      </div>
    </div>
  );
};

export default Index;
