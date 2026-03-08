export type UnitType = 'infantry' | 'cavalry' | 'armor' | 'artillery' | 'naval' | 'air' | 'hq' | 'supply';
export type DrawToolType = 'select' | 'arrow';
export type LayerType = 'background' | 'drawings' | 'units' | 'effects';

export type EffectType = 'explosion' | 'shake' | 'crack' | 'blood' | 'smoke' | 'fire';
export type TextAnimation = 'fade' | 'typewriter' | 'slide-up' | 'none';
export type OverlayTransition = 'fade' | 'slide' | 'none';

export interface MapObject {
  id: string;
  type: 'unit' | 'drawing' | 'effect';
  unitType?: UnitType;
  label?: string;
  customIcon?: string;
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
  time: number;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  visible: boolean;
}

export interface UnitEffect {
  id: string;
  type: EffectType;
  startTime: number;
  duration: number;
  intensity: number; // 0-1
  persistent: boolean; // true = damage stays visible after effect ends
}

export interface NarrationEvent {
  id: string;
  type: 'text' | 'voice' | 'text+voice';
  startTime: number;
  duration: number;
  text?: string;
  position: 'top' | 'bottom' | 'center' | 'custom';
  customX?: number;
  customY?: number;
  fontSize: number;
  fontStyle: 'normal' | 'bold' | 'italic';
  textAnimation: TextAnimation;
  textColor: string;
  bgOpacity: number;
  audioUrl?: string;
}

export interface OverlayEvent {
  id: string;
  startTime: number;
  duration: number;
  imageUrl: string;
  imagePosition: 'center' | 'left' | 'right';
  imageScale: number;
  backgroundEffect: 'blur' | 'dim' | 'blur+dim';
  dimOpacity: number;
  title?: string;
  subtitle?: string;
  textPosition: 'below-image' | 'beside-image' | 'bottom';
  transition: OverlayTransition;
}

export interface Scene {
  id: string;
  name: string;
  duration: number;
  backgroundImage?: string;
  objectsById: Record<string, MapObject>;
  objectOrder: string[];
  keyframesByObjectId: Record<string, Keyframe[]>;
  effectsByObjectId: Record<string, UnitEffect[]>;
  narrationEvents: NarrationEvent[];
  overlayEvents: OverlayEvent[];
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

export interface ActiveEffect {
  type: EffectType;
  progress: number; // 0-1 within effect duration
  intensity: number;
  persistent: boolean;
  ended: boolean; // true if time > startTime + duration
}
