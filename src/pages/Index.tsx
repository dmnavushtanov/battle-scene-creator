import React, { useState } from 'react';
import Toolbar from '@/components/editor/Toolbar';
import AssetLibrary from '@/components/editor/AssetLibrary';
import MapCanvas from '@/components/editor/MapCanvas';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import TimelinePanel from '@/components/editor/TimelinePanel';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

const Index: React.FC = () => {
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

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
        <div className="w-52 flex-shrink-0">
          <AssetLibrary />
        </div>

        {/* Center: Canvas */}
        <MapCanvas />

        {/* Right edge collapse handle */}
        <button
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
          title={rightPanelOpen ? 'Hide properties panel' : 'Show properties panel'}
          className={`absolute top-1/2 -translate-y-1/2 z-20 h-14 w-6 border border-border bg-panel text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${
            rightPanelOpen ? 'right-56 rounded-l-md border-r-0' : 'right-0 rounded-l-md'
          }`}
        >
          {rightPanelOpen ? <PanelRightClose size={14} className="mx-auto" /> : <PanelRightOpen size={14} className="mx-auto" />}
        </button>

        {/* Right: Properties (collapsible) */}
        {rightPanelOpen && (
          <div className="w-56 flex-shrink-0">
            <PropertiesPanel />
          </div>
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
