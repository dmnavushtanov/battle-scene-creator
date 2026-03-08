import React, { useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { useEditorStore } from '@/store/editorStore';
import UnitIcon, { UNIT_TYPES } from './UnitIcon';
import type { UnitType, MapObject } from '@/domain/models';
import { ImageIcon, Trash2 } from 'lucide-react';

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

const AssetLibrary: React.FC = () => {
  const addObject = useEditorStore((s) => s.addObject);
  const setBackgroundImage = useEditorStore((s) => s.setBackgroundImage);
  const setSelectedIds = useEditorStore((s) => s.setSelectedIds);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const customIcons = useEditorStore((s) => s.customIcons);
  const addCustomIcon = useEditorStore((s) => s.addCustomIcon);
  const removeCustomIcon = useEditorStore((s) => s.removeCustomIcon);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const handleAddUnit = (unitType: UnitType) => {
    const obj: MapObject = {
      id: uuid(),
      type: 'unit',
      unitType,
      label: unitType,
      x: 400 + Math.random() * 200,
      y: 300 + Math.random() * 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      layer: 'units',
      visible: true,
      locked: false,
      width: ICON_RENDER_SIZE,
      height: ICON_RENDER_SIZE,
    };
    addObject(obj);
    setActiveTool('select');
    setSelectedIds([obj.id]);
  };

  const handleAddCustomUnit = (iconDataUrl: string, label: string) => {
    const obj: MapObject = {
      id: uuid(),
      type: 'unit',
      unitType: 'infantry',
      label,
      customIcon: iconDataUrl,
      x: 400 + Math.random() * 200,
      y: 300 + Math.random() * 200,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      layer: 'units',
      visible: true,
      locked: false,
      width: ICON_RENDER_SIZE,
      height: ICON_RENDER_SIZE,
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
      setBackgroundImage(reader.result as string);
    };
    reader.readAsDataURL(file);
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

      // Save to custom icons library
      addCustomIcon({ id: uuid(), label, dataUrl: resized });

      // Also place one on canvas immediately
      handleAddCustomUnit(resized, label);
    };
    reader.readAsDataURL(file);

    if (iconInputRef.current) iconInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col bg-panel border-r border-border">
      <div className="px-3 py-3 border-b border-border">
        <h2 className="text-xs font-mono font-semibold uppercase tracking-widest text-primary amber-glow">
          Assets
        </h2>
      </div>

      {/* Map Upload */}
      <div className="px-3 py-3 border-b border-border">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Background Map
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2 px-3 text-xs font-mono bg-muted hover:bg-muted/80 border border-border rounded text-foreground transition-colors"
        >
          Upload Map Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleMapUpload}
          className="hidden"
        />
      </div>

      {/* Unit Types */}
      <div className="px-3 py-3 flex-1 overflow-y-auto scrollbar-tactical">
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
          Units
        </p>
        <div className="grid grid-cols-2 gap-2">
          {UNIT_TYPES.map((u) => (
            <button
              key={u.type}
              onClick={() => handleAddUnit(u.type)}
              className="flex flex-col items-center gap-1.5 p-2 rounded border border-border bg-muted hover:border-primary/50 hover:bg-primary/5 transition-colors group"
            >
              <UnitIcon unitType={u.type} size={32} />
              <span className="text-[9px] font-mono uppercase text-muted-foreground group-hover:text-foreground">
                {u.label}
              </span>
            </button>
          ))}
        </div>

        {/* My Icons */}
        {customIcons.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
              My Icons
            </p>
            <div className="grid grid-cols-2 gap-2">
              {customIcons.map((icon) => (
                <div key={icon.id} className="relative group">
                  <button
                    onClick={() => handleAddCustomUnit(icon.dataUrl, icon.label)}
                    className="w-full flex flex-col items-center gap-1.5 p-2 rounded border border-border bg-muted hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <img src={icon.dataUrl} alt={icon.label} className="w-8 h-8 object-contain" />
                    <span className="text-[9px] font-mono uppercase text-muted-foreground group-hover:text-foreground truncate w-full text-center">
                      {icon.label}
                    </span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCustomIcon(icon.id); }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={8} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Icon Upload */}
        <div className="mt-4 pt-3 border-t border-border">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Custom Icon
          </p>
          <button
            onClick={() => iconInputRef.current?.click()}
            className="w-full py-2.5 px-3 text-xs font-mono bg-muted hover:bg-muted/80 border border-dashed border-primary/30 hover:border-primary/60 rounded text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <ImageIcon size={14} />
            Upload Icon (max {MAX_ICON_KB}KB)
          </button>
          <p className="text-[8px] font-mono text-muted-foreground/60 mt-1.5 text-center">
            Auto-resized to {ICON_RENDER_SIZE}×{ICON_RENDER_SIZE}px
          </p>
          <input
            ref={iconInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleIconUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default AssetLibrary;
