import React from 'react';
import Toolbar from '@/components/editor/Toolbar';
import AssetLibrary from '@/components/editor/AssetLibrary';
import MapCanvas from '@/components/editor/MapCanvas';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import TimelinePanel from '@/components/editor/TimelinePanel';

const Index: React.FC = () => {
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
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-muted-foreground">
            Browser-only • No server
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar />

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Asset Library */}
        <div className="w-52 flex-shrink-0">
          <AssetLibrary />
        </div>

        {/* Center: Canvas */}
        <MapCanvas />

        {/* Right: Properties */}
        <div className="w-56 flex-shrink-0">
          <PropertiesPanel />
        </div>
      </div>

      {/* Bottom: Timeline */}
      <div className="h-44 flex-shrink-0">
        <TimelinePanel />
      </div>
    </div>
  );
};

export default Index;
