export type UnitType = string;

export type ObjectCategory = 'military' | 'structure' | 'prop' | 'terrain';
export type DrawToolType = 'select' | 'arrow' | 'path' | 'animated_arrow' | 'text';
export type LayerType = 'background' | 'drawings' | 'units' | 'effects';

export type EffectType = 'explosion' | 'shake' | 'crack' | 'blood' | 'smoke' | 'fire' | 'gunshot';
export type TextAnimation = 'fade' | 'typewriter' | 'slide-up' | 'none';
export type OverlayTransition = 'fade' | 'slide' | 'none';

export interface MapObject {
  id: string;
  type: 'unit' | 'drawing' | 'effect' | 'animated_arrow' | 'map_text';
  unitType?: UnitType;
  objectCategory?: ObjectCategory;
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
  effectType?: EffectType;
  // Faction color (applies to units, arrows, text)
  factionColor?: string;
  // Map text properties
  text?: string;
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  // Animated arrow timing
  animStartTime?: number;
  animEndTime?: number;
  // Unit lifespan on timeline
  startTime?: number;
  endTime?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
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
  intensity: number;
  persistent: boolean;
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

export interface SoundEvent {
  id: string;
  startTime: number;
  duration: number;
  audioUrl: string;
  label: string;
  volume: number;
}

export interface UnitGroup {
  id: string;
  name: string;
  color: string;
  memberIds: string[];
}

export interface CameraKeyframe {
  time: number;
  x: number;
  y: number;
  scale: number;
}

export interface Scene {
  id: string;
  name: string;
  duration: number;
  backgroundImage?: string;
  objectsById: Record<string, MapObject>;
  objectOrder: string[];
  keyframesByObjectId: Record<string, Keyframe[]>;
  cameraKeyframes?: CameraKeyframe[];
  effectsByObjectId: Record<string, UnitEffect[]>;
  narrationEvents: NarrationEvent[];
  overlayEvents: OverlayEvent[];
  soundEvents: SoundEvent[];
  groups: Record<string, UnitGroup>;
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
  progress: number;
  intensity: number;
  persistent: boolean;
  ended: boolean;
}
