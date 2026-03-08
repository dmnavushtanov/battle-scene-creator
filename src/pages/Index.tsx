import React from 'react';
import Toolbar from '@/components/editor/Toolbar';
import AssetLibrary from '@/components/editor/AssetLibrary';
import MapCanvas from '@/components/editor/MapCanvas';
import PropertiesPanel from '@/components/editor/PropertiesPanel';
import TimelinePanel from '@/components/editor/TimelinePanel';
import NarrationOverlay from '@/components/editor/NarrationOverlay';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useState } from 'react';

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

      <Toolbar />

      <ResizablePanelGroup direction="vertical" className="flex-1">
        <ResizablePanel defaultSize={75} minSize={40}>
          <div className="flex h-full relative">
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

            <div className="flex-1 relative overflow-hidden">
              <MapCanvas />
              <NarrationOverlay />
            </div>

            <button
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              title={rightPanelOpen ? 'Hide properties panel' : 'Show properties panel'}
              className={`absolute top-1/2 -translate-y-1/2 z-20 h-14 w-6 border border-border bg-panel text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${
                rightPanelOpen ? 'right-72 rounded-l-md border-r-0' : 'right-0 rounded-l-md'
              }`}
            >
              {rightPanelOpen ? <PanelRightClose size={14} className="mx-auto" /> : <PanelRightOpen size={14} className="mx-auto" />}
            </button>

            {rightPanelOpen && (
              <div className="w-72 flex-shrink-0 overflow-y-auto">
                <PropertiesPanel />
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={25} minSize={12} maxSize={50}>
          <TimelinePanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
