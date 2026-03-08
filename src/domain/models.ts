export type UnitType = 'infantry' | 'cavalry' | 'armor' | 'artillery' | 'naval' | 'air' | 'hq' | 'supply';
export type DrawToolType = 'select' | 'arrow' | 'line' | 'freehand' | 'rectangle' | 'circle';
export type LayerType = 'background' | 'drawings' | 'units' | 'effects';

export interface MapObject {
  id: string;
  type: 'unit' | 'drawing' | 'effect';
  unitType?: UnitType;
  label?: string;
  customIcon?: string; // data URL for user-uploaded icon
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  layer: LayerType;
  visible: boolean;
  locked: boolean;
  drawTool?: DrawToolType;
  points?: number[];
  width?: number;
  height?: number;
  color?: string;
}

export interface Keyframe {
  time: number; // ms within the scene
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
}

export interface Scene {
  id: string;
  name: string;
  duration: number; // ms
  backgroundImage?: string;
  objectsById: Record<string, MapObject>;
  objectOrder: string[]; // z-order
  keyframesByObjectId: Record<string, Keyframe[]>; // each array sorted by time
}

export interface ProjectData {
  version: string;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  scenes: Scene[];
}

export interface ObjectSnapshot {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
}
