# Battle Map Builder & Timeline Animator

A 100% browser-based tactical battle map editor for creating animated military-style visualizations — similar to YouTube battle recap videos. Place NATO-style unit icons on a map, record their movements in real-time, and play back the full animation on a timeline. Everything runs client-side with no server or database required. Deployable as a static site.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Canvas / Rendering | Konva.js via `react-konva` (multi-layer stage, transforms, drag-and-drop) |
| State Management | Zustand (single normalized store) |
| Styling | Tailwind CSS + custom military design tokens (amber/olive/charcoal palette via HSL CSS variables) |
| UI Components | shadcn/ui (Radix primitives) |
| Icons | Lucide React |
| Routing | React Router DOM (single route `/`) |
| ID Generation | `uuid` v4 |
| Hosting | Static site — GitHub Pages, Netlify, or any CDN |

---

## Core Features

- **Canvas Editor** — Load a background map image (user upload as data URL), then drag-and-drop military unit icons (infantry, cavalry, armor, artillery, naval, air, HQ, supply) onto a Konva stage with grid overlay, zoom, and pan.
- **Record Movement** — Click **Record**, drag one or more units to new positions, click **Stop**. The app captures start/end keyframes with configurable duration so all moved units animate together on playback.
- **Deterministic Playback** — A `requestAnimationFrame` loop drives playback. Object transforms at any time `t` are computed purely from keyframes via linear interpolation — no runtime state mutation.
- **Multi-Select Group Drag** — Shift-click to select multiple units. Dragging one selected unit moves all selected by the same delta, maintaining relative offsets. During recording, the entire group shares the same `t0`/`t1`.
- **Timeline Panel** — Bottom panel with play/pause, time display, draggable playhead scrub, ruler tick marks, and per-object keyframe markers.
- **Properties Panel** — Edit position, rotation, scale, visibility of selected units. Manually insert keyframes at the current playhead time. Clear keyframes per object or globally.
- **Import/Export** — Export the entire project (scenes, objects, keyframes, background image data URL) as a versioned JSON file. Import restores everything with basic migration support.
- **Scene Management** — Projects support multiple scenes with configurable durations (currently single active scene editing).

---

## Architecture & File Map

```
src/
├── main.tsx                          # React entry point, renders <App />
├── App.tsx                           # Router setup (single route → Index page)
├── index.css                         # Tailwind base + custom CSS variables (design tokens)
│
├── domain/                           # Pure business logic (no React, no UI)
│   ├── models.ts                     # All TypeScript interfaces:
│   │                                 #   - ProjectData (top-level: version, name, canvas size, scenes[])
│   │                                 #   - Scene (id, name, duration, backgroundImage, objectsById, objectOrder, keyframesByObjectId)
│   │                                 #   - MapObject (id, type, unitType, position, rotation, scale, layer, visibility, lock)
│   │                                 #   - Keyframe (time, x, y, rotation, scaleX, scaleY, visible)
│   │                                 #   - ObjectSnapshot (computed transform at a point in time)
│   │                                 #   - UnitType, DrawToolType, LayerType enums
│   │
│   └── services/
│       ├── timeline.ts               # Deterministic interpolation engine:
│       │                             #   - evaluateObjectAtTime(obj, keyframes[], t) → ObjectSnapshot
│       │                             #     Returns linearly interpolated x,y,rotation,scale,visible
│       │                             #     from sorted keyframes. Falls back to object's static transform
│       │                             #     if no keyframes exist.
│       │                             #   - upsertKeyframe(keyframes[], kf) → sorted deduplicated array
│       │
│       ├── recording.ts              # Recording session management (pure functions):
│       │                             #   - RecordingSession type (startTime, durationMs, movedObjectIds, initialSnapshots)
│       │                             #   - createRecordingSession(startTime, durationMs) → new session
│       │                             #   - captureInitialSnapshot(session, obj) → mutates session, captures pre-move state
│       │                             #   - finalizeRecording(session, objectsById, existingKeyframes) → updated keyframesByObjectId
│       │                             #     For each moved object: inserts keyframe at t0 (from snapshot) and t1 (from current position)
│       │
│       └── serialization.ts          # Project persistence:
│                                     #   - exportProject(project) → JSON string (with version "1.0")
│                                     #   - importProject(json) → ProjectData (parses, migrates old flat format if needed)
│
├── store/
│   └── editorStore.ts                # Zustand store — single source of truth for all editor state:
│                                     #   STATE:
│                                     #     project: ProjectData (normalized scene-first model)
│                                     #     activeSceneId, selectedIds[], activeTool, activeLayer
│                                     #     currentTime, isPlaying, isRecording, recordingSession
│                                     #     recordDurationSeconds (configurable, default 2.0)
│                                     #     stageScale, stagePosition (zoom/pan)
│                                     #     derivedTransforms: Record<string, ObjectSnapshot> (computed during playback)
│                                     #
│                                     #   KEY ACTIONS:
│                                     #     addObject / removeObject / updateObject — CRUD on active scene's objectsById
│                                     #     startRecording / stopRecording — manage RecordingSession lifecycle
│                                     #     onObjectDragStart/Move/End — track movement, capture snapshots during recording
│                                     #     onGroupDragMove — apply delta to all selected objects
│                                     #     seekTo(time) — set currentTime + recompute derived transforms
│                                     #     computeDerivedTransforms(time) — runs evaluateObjectAtTime for all objects
│                                     #     addKeyframeAtTime / clearKeyframes / clearAllKeyframes
│                                     #     exportProject / importProject — JSON round-trip
│                                     #     setBackgroundImage, setSceneDuration, setStageScale, setStagePosition
│
├── pages/
│   ├── Index.tsx                     # Main editor layout — assembles all panels:
│   │                                 #   Header bar → Toolbar → 3-column body (AssetLibrary | MapCanvas | PropertiesPanel) → TimelinePanel
│   └── NotFound.tsx                  # 404 page
│
├── components/
│   ├── NavLink.tsx                   # Reusable nav link component
│   │
│   └── editor/                       # All editor UI components:
│       ├── MapCanvas.tsx             # Konva Stage rendering:
│       │                             #   - Grid overlay layer
│       │                             #   - Background image layer (from scene.backgroundImage)
│       │                             #   - Unit rendering layer: reads derivedTransforms during playback,
│       │                             #     raw objectsById during editing
│       │                             #   - Drag handlers: onDragStart/Move/End update store,
│       │                             #     trigger group movement for multi-select
│       │                             #   - Shift-click for multi-select, click for single select
│       │                             #   - Wheel zoom + stage panning
│       │                             #   - Red "● REC" overlay during recording
│       │                             #   - Drop handler for adding units from AssetLibrary
│       │
│       ├── Toolbar.tsx               # Top toolbar:
│       │                             #   - Tool buttons: Select, Arrow, Line, Freehand, Rectangle, Circle (draw tools are stubs)
│       │                             #   - Record/Stop button with duration input (seconds)
│       │                             #   - Delete selected objects button
│       │                             #   - Import/Export project buttons (JSON file download/upload)
│       │
│       ├── AssetLibrary.tsx          # Left panel — unit palette:
│       │                             #   - Grid of draggable unit tiles (infantry, cavalry, armor, artillery, naval, air, HQ, supply)
│       │                             #   - "Upload Map Image" button (reads file as data URL → setBackgroundImage)
│       │                             #   - Drag-and-drop: tiles are draggable, MapCanvas handles the drop to create MapObject
│       │
│       ├── PropertiesPanel.tsx       # Right panel — selected object editor:
│       │                             #   - Shows when 1 object is selected
│       │                             #   - Editable fields: X, Y, Rotation, Scale X, Scale Y
│       │                             #   - Visibility toggle, Lock toggle
│       │                             #   - "Add Keyframe at Playhead" button — inserts keyframe at currentTime
│       │                             #   - "Clear Keyframes" button — removes all keyframes for selected object
│       │                             #   - "Clear ALL Keyframes" button — removes all keyframes in active scene
│       │
│       ├── TimelinePanel.tsx         # Bottom panel — playback controls:
│       │                             #   - Play/Pause button
│       │                             #   - Current time display (seconds) + scene duration
│       │                             #   - Scene duration editor (seconds input)
│       │                             #   - Ruler with tick marks (every 500ms, labels every 1s)
│       │                             #   - Draggable playhead (scrubs currentTime via seekTo)
│       │                             #   - Keyframe diamond markers on the ruler for all objects
│       │                             #   - requestAnimationFrame playback loop:
│       │                             #     increments currentTime, calls computeDerivedTransforms,
│       │                             #     auto-stops at scene duration
│       │
│       └── UnitIcon.tsx              # SVG NATO-style military unit symbol renderer:
│                                     #   - Renders unit type icons (infantry ×, cavalry /, armor ◇, etc.)
│                                     #   - Unified amber color scheme
│                                     #   - Used both in AssetLibrary tiles and on MapCanvas
│
├── utils/
│   └── ids.ts                        # ID generation utility (re-exports uuid v4)
│
├── hooks/                            # React hooks
│   ├── use-mobile.tsx                # Mobile detection hook
│   └── use-toast.ts                  # Toast notification hook
│
├── lib/
│   └── utils.ts                      # Tailwind `cn()` merge utility
│
└── components/ui/                    # shadcn/ui primitives (button, dialog, input, slider, tabs, etc.)
```

---

## Data Model (Normalized)

```
ProjectData
├── version: "1.0"
├── name: string
├── canvasWidth / canvasHeight: number
└── scenes: Scene[]
    └── Scene
        ├── id: string (uuid)
        ├── name: string
        ├── duration: number (ms)
        ├── backgroundImage?: string (data URL)
        ├── objectsById: Record<string, MapObject>
        ├── objectOrder: string[] (z-order, bottom to top)
        └── keyframesByObjectId: Record<string, Keyframe[]> (sorted by time)

MapObject
├── id, type ('unit'|'drawing'|'effect'), unitType?
├── x, y, rotation, scaleX, scaleY
├── layer ('background'|'drawings'|'units'|'effects')
├── visible, locked
└── drawTool?, points?, width?, height?, color?

Keyframe
├── time (ms within scene)
├── x, y, rotation, scaleX, scaleY, visible
```

---

## How Recording Works

1. User clicks **Record** → `startRecording()` creates a `RecordingSession` with `startTime = currentTime` and `durationMs = recordDurationSeconds × 1000`.
2. User drags units → `onObjectDragStart` calls `captureInitialSnapshot()` to save the object's pre-move transform. For multi-select, all selected objects get snapshots.
3. User clicks **Stop** → `stopRecording()` calls `finalizeRecording()` which:
   - For each moved object, creates a keyframe at `t0` (from snapshot) and `t1 = t0 + durationMs` (from current position).
   - Upserts into the existing sorted keyframe arrays.
4. Multiple recordings can be chained: record A→B at t=0, then seek to t=2000 and record B→C.

## How Playback Works

1. User clicks **Play** → `TimelinePanel` starts a `requestAnimationFrame` loop.
2. Each frame: `currentTime` advances based on wall-clock delta.
3. `computeDerivedTransforms(time)` runs `evaluateObjectAtTime()` for every object in the scene.
4. `evaluateObjectAtTime()` finds the two surrounding keyframes and returns linearly interpolated `{x, y, rotation, scaleX, scaleY, visible}`.
5. `MapCanvas` reads `derivedTransforms` (during playback) or raw `objectsById` (during editing) to position units.
6. Playback auto-stops when `currentTime >= scene.duration`.

---

## Running Locally

```sh
git clone <REPO_URL>
cd <PROJECT_DIR>
npm install
npm run dev
```

## Planned Features

- Drawing tools (arrows, lines, freehand paths) on canvas
- Effects layer (explosions, gunfire sprites at specific timestamps)
- WebM/MP4 video export via `canvas.captureStream()` + `MediaRecorder`
- Formation movement with maintained relative offsets
- Undo/redo system
- Audio triggers and narration text tracks
- Multi-scene editing with scene transitions
