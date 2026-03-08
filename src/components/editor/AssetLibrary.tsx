import React, { useRef } from 'react';
import { v4 as uuid } from 'uuid';
import { useEditorStore } from '@/store/editorStore';
import UnitIcon, { UNIT_TYPES } from './UnitIcon';
import type { UnitType, MapObject } from '@/domain/models';

const AssetLibrary: React.FC = () => {
  const addObject = useEditorStore((s) => s.addObject);
  const setBackgroundImage = useEditorStore((s) => s.setBackgroundImage);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      width: 50,
      height: 50,
    };
    addObject(obj);
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
      </div>
    </div>
  );
};

export default AssetLibrary;
