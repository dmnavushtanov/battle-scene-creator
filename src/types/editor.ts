export type UnitType = 'infantry' | 'cavalry' | 'armor' | 'artillery' | 'naval' | 'air' | 'hq' | 'supply';
export type DrawToolType = 'select' | 'arrow' | 'line' | 'freehand' | 'rectangle' | 'circle';
export type LayerType = 'background' | 'drawings' | 'units' | 'effects';

export interface Position {
  x: number;
  y: number;
}

export interface MapObject {
  id: string;
  type: 'unit' | 'drawing' | 'effect';
  unitType?: UnitType;
  label?: string;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  layer: LayerType;
  visible: boolean;
  locked: boolean;
  // Drawing-specific
  drawTool?: DrawToolType;
  points?: number[];
  // Visual
  width?: number;
  height?: number;
  color?: string;
}

export interface Keyframe {
  id: string;
  objectId: string;
  time: number; // ms
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface Scene {
  id: string;
  name: string;
  duration: number; // ms
  order: number;
}

export interface ProjectData {
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundImage?: string;
  objects: MapObject[];
  keyframes: Keyframe[];
  scenes: Scene[];
}

export interface EditorState {
  // Project
  project: ProjectData;
  // Selection
  selectedIds: string[];
  activeTool: DrawToolType;
  activeLayer: LayerType;
  // Timeline
  currentTime: number;
  isPlaying: boolean;
  activeSceneId: string | null;
  // Recording
  isRecording: boolean;
  recordingStartTime: number;
  recordingStartPositions: Record<string, Position>;
  // Zoom/Pan
  stageScale: number;
  stagePosition: Position;
  // Actions
  addObject: (obj: MapObject) => void;
  removeObject: (id: string) => void;
  updateObject: (id: string, updates: Partial<MapObject>) => void;
  setSelectedIds: (ids: string[]) => void;
  setActiveTool: (tool: DrawToolType) => void;
  setActiveLayer: (layer: LayerType) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setStageScale: (scale: number) => void;
  setStagePosition: (pos: Position) => void;
  setBackgroundImage: (url: string) => void;
  addKeyframe: (kf: Keyframe) => void;
  removeKeyframe: (id: string) => void;
  addScene: (scene: Scene) => void;
  exportProject: () => string;
  importProject: (json: string) => void;
  // Recording actions
  startRecording: () => void;
  stopRecording: () => void;
  recordPosition: (id: string, x: number, y: number) => void;
}
