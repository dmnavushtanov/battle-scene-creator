import React, { useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useEditorStore } from '@/store/editorStore';
import UnitIcon, { UNIT_TYPES, UNIT_CATEGORIES } from './UnitIcon';
import type { UnitType, MapObject, ObjectCategory } from '@/domain/models';
import { ImageIcon, Trash2, Sparkles, GripVertical, Volume2, ChevronDown, ChevronRight } from 'lucide-react';
import { EFFECT_PRESETS } from '@/domain/services/effects';
import { EFFECT_COLORS, UNIT_CATEGORY } from '@/domain/constants';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

const MAX_ICON_KB = 200;
const ICON_RENDER_SIZE = 50;

function resizeImageToSquare(dataUrl: string, size: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = dataUrl;
  });
}

type Tab = 'units' | 'effects' | 'sounds';

const AssetLibrary: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('units');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    military: true, structure: true, prop: true, terrain: true, custom: true,
  });
  const addObject = useEditorStore((s) => s.addObject);
  const setBackgroundImage = useEditorStore((s) => s.setBackgroundImage);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const customIcons = useEditorStore((s) => s.customIcons);
  const addCustomIcon = useEditorStore((s) => s.addCustomIcon);
  const removeCustomIcon = useEditorStore((s) => s.removeCustomIcon);
  const addSound = useEditorStore((s) => s.addSound);
  const currentTime = useEditorStore((s) => s.currentTime);
  const mapLibrary = useEditorStore((s) => s.mapLibrary);
  const addMapToLibrary = useEditorStore((s) => s.addMapToLibrary);
  const removeMapFromLibrary = useEditorStore((s) => s.removeMapFromLibrary);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const soundInputRef = useRef<HTMLInputElement>(null);

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddUnit = (unitType: UnitType) => {
    const category = UNIT_CATEGORY[unitType] as ObjectCategory || 'military';
    const obj: MapObject = {
      id: uuid(), type: 'unit', unitType, objectCategory: category, label: unitType,
      x: 400 + Math.random() * 200, y: 300 + Math.random() * 200,
      rotation: 0, scaleX: 1, scaleY: 1, layer: 'units',
      visible: true, locked: false, width: ICON_RENDER_SIZE, height: ICON_RENDER_SIZE,
    };
    addObject(obj);
    setActiveTool('select');
    setSelectedIds([obj.id]);
  };

  const handleAddCustomUnit = (iconDataUrl: string, label: string) => {
    const obj: MapObject = {
      id: uuid(), type: 'unit', unitType: 'infantry', label, customIcon: iconDataUrl,
      x: 400 + Math.random() * 200, y: 300 + Math.random() * 200,
      rotation: 0, scaleX: 1, scaleY: 1, layer: 'units',
      visible: true, locked: false, width: ICON_RENDER_SIZE, height: ICON_RENDER_SIZE,
    };
    addObject(obj);
    setActiveTool('select');
    setSelectedIds([obj.id]);
  };

  const handleMapUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const label = file.name.replace(/\.[^.]+$/, '').slice(0, 20);
      addMapToLibrary({ id: uuid(), label, dataUrl });
      setBackgroundImage(dataUrl);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ICON_KB * 1024) {
      alert(`Icon must be under ${MAX_ICON_KB}KB. Your file is ${Math.round(file.size / 1024)}KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const resized = await resizeImageToSquare(dataUrl, ICON_RENDER_SIZE * 2);
      const label = file.name.replace(/\.[^.]+$/, '').slice(0, 12);
      addCustomIcon({ id: uuid(), label, dataUrl: resized });
      handleAddCustomUnit(resized, label);
    };
    reader.readAsDataURL(file);
    if (iconInputRef.current) iconInputRef.current.value = '';
  };

  const handleSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const audioUrl = reader.result as string;
      const label = file.name.replace(/\.[^.]+$/, '').slice(0, 20);
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        const duration = Math.round(audio.duration * 1000) || 3000;
        addSound({ id: uuid(), startTime: currentTime, duration, audioUrl, label, volume: 1 });
      };
      audio.onerror = () => {
        addSound({ id: uuid(), startTime: currentTime, duration: 3000, audioUrl, label, volume: 1 });
      };
    };
    reader.readAsDataURL(file);
    if (soundInputRef.current) soundInputRef.current.value = '';
  };

  const handleEffectDragStart = (e: React.DragEvent, presetIndex: number) => {
    e.dataTransfer.setData('application/effect-preset', String(presetIndex));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleUnitDragStart = (e: React.DragEvent, unitType: UnitType) => {
    e.dataTransfer.setData('application/unit-type', unitType);
    e.dataTransfer.setData('application/unit-label', unitType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCustomUnitDragStart = (e: React.DragEvent, iconDataUrl: string, label: string) => {
    e.dataTransfer.setData('application/unit-type', 'infantry');
    e.dataTransfer.setData('application/unit-label', label);
    e.dataTransfer.setData('application/custom-icon', iconDataUrl);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="h-full flex flex-col bg-panel border-r border-border">
      <div className="px-3 py-3 border-b border-border">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary amber-glow">Assets</h2>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border">
        <button onClick={() => setActiveTab('units')} className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${activeTab === 'units' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}>
          Units
        </button>
        <button onClick={() => setActiveTab('effects')} className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${activeTab === 'effects' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}>
          <Sparkles size={10} /> Effects
        </button>
        <button onClick={() => setActiveTab('sounds')} className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${activeTab === 'sounds' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}>
          <Volume2 size={10} /> Sound
        </button>
      </div>

      {activeTab === 'units' && (
        <>
          <div className="px-3 py-3 border-b border-border">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Background Map</p>
            {mapLibrary.length > 0 && (
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {mapLibrary.map((m) => (
                  <div key={m.id} className="relative group">
                    <button
                      onClick={() => setBackgroundImage(m.dataUrl)}
                      className="w-full aspect-video rounded border border-border overflow-hidden hover:border-primary/50 transition-colors"
                      title={`Use "${m.label}" as background`}
                    >
                      <img src={m.dataUrl} alt={m.label} className="w-full h-full object-cover" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); removeMapFromLibrary(m.id); }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={8} />
                    </button>
                    <span className="text-[7px] font-mono text-muted-foreground truncate block text-center mt-0.5">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => fileInputRef.current?.click()} className="w-full py-2 px-3 text-xs font-mono bg-muted hover:bg-muted/80 border border-border rounded text-foreground transition-colors">
              Upload Map Image
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMapUpload} className="hidden" />
          </div>
          <div className="px-3 py-3 flex-1 overflow-y-auto scrollbar-tactical">
            <p className="text-[8px] font-mono text-muted-foreground/60 mb-2">Click to add or drag onto canvas</p>

            {/* Collapsible categories */}
            {UNIT_CATEGORIES.map((cat) => {
              const items = UNIT_TYPES.filter((u) => u.category === cat.key);
              const isOpen = expandedCategories[cat.key] ?? true;
              return (
                <Collapsible key={cat.key} open={isOpen} onOpenChange={() => toggleCategory(cat.key)}>
                  <CollapsibleTrigger className="w-full flex items-center gap-1.5 py-1.5 mb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {isOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className="text-muted-foreground/40 ml-auto">{items.length}</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-2 gap-1.5 mb-3">
                      {items.map((u) => (
                        <button
                          key={u.type}
                          onClick={() => handleAddUnit(u.type)}
                          draggable
                          onDragStart={(e) => handleUnitDragStart(e, u.type)}
                          className="flex flex-col items-center gap-1 p-1.5 rounded border border-border bg-muted hover:border-primary/50 hover:bg-primary/5 transition-colors group cursor-grab active:cursor-grabbing"
                        >
                          <UnitIcon unitType={u.type} size={28} />
                          <span className="text-[8px] font-mono uppercase text-muted-foreground group-hover:text-foreground">{u.label}</span>
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}

            {/* Custom icons */}
            <Collapsible open={expandedCategories['custom'] ?? true} onOpenChange={() => toggleCategory('custom')}>
              <CollapsibleTrigger className="w-full flex items-center gap-1.5 py-1.5 mb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                {expandedCategories['custom'] ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                <span>🎨</span>
                <span>My Icons</span>
                <span className="text-muted-foreground/40 ml-auto">{customIcons.length}</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {customIcons.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {customIcons.map((icon) => (
                      <div key={icon.id} className="relative group">
                        <button
                          onClick={() => handleAddCustomUnit(icon.dataUrl, icon.label)}
                          draggable
                          onDragStart={(e) => handleCustomUnitDragStart(e, icon.dataUrl, icon.label)}
                          className="w-full flex flex-col items-center gap-1 p-1.5 rounded border border-border bg-muted hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-grab active:cursor-grabbing"
                        >
                          <img src={icon.dataUrl} alt={icon.label} className="w-7 h-7 object-contain" />
                          <span className="text-[8px] font-mono uppercase text-muted-foreground group-hover:text-foreground truncate w-full text-center">{icon.label}</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeCustomIcon(icon.id); }} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={8} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={() => iconInputRef.current?.click()} className="w-full py-2 px-3 text-xs font-mono bg-muted hover:bg-muted/80 border border-dashed border-primary/30 hover:border-primary/60 rounded text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2">
                  <ImageIcon size={14} /> Upload Icon (max {MAX_ICON_KB}KB)
                </button>
                <p className="text-[8px] font-mono text-muted-foreground/60 mt-1 text-center">Auto-resized to {ICON_RENDER_SIZE}×{ICON_RENDER_SIZE}px</p>
                <input ref={iconInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleIconUpload} className="hidden" />
              </CollapsibleContent>
            </Collapsible>
          </div>
        </>
      )}

      {activeTab === 'effects' && (
        <div className="px-3 py-3 flex-1 overflow-y-auto scrollbar-tactical">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Effect Presets
          </p>
          <p className="text-[9px] font-mono text-muted-foreground/60 mb-3">
            🎯 Drag onto a unit or empty map space to place
          </p>
          <div className="space-y-1.5">
            {EFFECT_PRESETS.map((preset, idx) => (
              <div
                key={preset.type}
                draggable
                onDragStart={(e) => handleEffectDragStart(e, idx)}
                className="w-full flex items-center gap-3 p-2.5 rounded border border-border bg-muted hover:border-primary/50 hover:bg-primary/5 transition-colors group cursor-grab active:cursor-grabbing"
                style={{ borderLeftColor: EFFECT_COLORS[preset.type] || '#ff6600', borderLeftWidth: 3 }}
              >
                <GripVertical size={10} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                <span className="text-lg">{preset.icon}</span>
                <div className="text-left flex-1">
                  <p className="text-[10px] font-mono font-semibold text-foreground group-hover:text-primary transition-colors">{preset.label}</p>
                  <p className="text-[8px] font-mono text-muted-foreground">{preset.description} · {(preset.defaultDuration / 1000).toFixed(1)}s{preset.persistent && ' · persistent'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sounds' && (
        <div className="px-3 py-3 flex-1 overflow-y-auto scrollbar-tactical">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Sound Files
          </p>
          <p className="text-[9px] font-mono text-muted-foreground/60 mb-3">
            🔊 Upload audio files to add to the timeline
          </p>
          <button
            onClick={() => soundInputRef.current?.click()}
            className="w-full py-3 px-3 text-xs font-mono bg-muted hover:bg-muted/80 border border-dashed border-primary/30 hover:border-primary/60 rounded text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <Volume2 size={14} /> Upload Sound File
          </button>
          <p className="text-[8px] font-mono text-muted-foreground/60 mt-1.5 text-center">
            MP3, WAV, OGG, WebM audio supported
          </p>
          <input
            ref={soundInputRef}
            type="file"
            accept="audio/*"
            onChange={handleSoundUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
};

export default AssetLibrary;
