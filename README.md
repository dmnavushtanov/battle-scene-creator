# Battle Map Builder & Timeline Animator

A 100% browser-based tactical battle map editor for creating animated military-style visualizations — similar to YouTube battle recap videos. Place NATO-style unit icons on a map, record their movements in real-time, and play back the full animation on a timeline. Everything runs client-side with no server or database required.

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
| ID Generation | `uuid` v4 |

---

## Core Features

### Canvas Editor
- Load background map images (user upload as data URL)
- Place military unit icons (infantry, cavalry, armor, artillery, naval, air, HQ, supply) on a Konva stage
- Grid overlay, zoom (scroll wheel), pan (middle mouse button)
- Upload custom unit icons (auto-resized, max 200KB)
- Click-away deselection — click empty canvas to deselect all

### Effects System
- **6 effect types**: Shake, Explosion, Crack, Blood, Smoke, Fire
- Effects attach to units with configurable start time, duration, and intensity
- **Cinematic visuals**: Explosions with shockwave rings + debris particles, volumetric smoke with multi-frequency turbulence, layered fire with flickering flames + rising embers, organic blood splatters with drip trails, fracture webs with depth shading
- **Persistent effects**: Crack and blood remain visible after the effect ends
- **Drag-and-drop from sidebar**: Drag effect presets from the Effects tab onto units or empty canvas
- **Standalone map effects**: Drop effects on empty space to create map-level effects (fire on terrain, etc.)
- **Timeline control**: Drag effect blocks to reposition, resize edges to adjust start/duration

### Narration & Overlay System
- **Narration track**: Add text captions that appear during playback with configurable position, font, animation (fade/typewriter/slide-up), and colors
- **Overlay track**: Add full-screen image cutaways with blur/dim background effects, titles, subtitles, and transitions
- **Click to edit**: Click narration/overlay blocks on the timeline to open their editor in the Properties panel
- **Resize & move**: Drag edges to adjust timing, drag center to reposition on timeline

### Persistent Named Groups
- Select multiple units (shift-click) and create a named group
- Groups are color-coded and persist across editing sessions
- Group badge shown on each member unit on the canvas
- "Select All" to quickly select all group members
- Add/remove units from existing groups
- Group members highlighted when any member is selected

### Recording & Playback
- **Record movement**: Click Record, drag units, click Stop — captures start/end keyframes
- **Multi-select group drag**: Shift-click to select multiple units, drag one to move all
- **Deterministic playback**: `requestAnimationFrame` loop with linear interpolation between keyframes
- **Timeline panel**: Play/pause, time scrub, per-object keyframe markers

### Properties Panel
- Edit position, rotation, scale, visibility, lock for selected units
- Add/remove keyframes at playhead time
- Manage effects per unit
- Create and manage groups
- Narration/overlay editors with full configuration

### Import/Export
- Export entire project as versioned JSON
- Import restores everything with migration support

---

## Architecture

```
src/
├── domain/
│   ├── models.ts              # TypeScript interfaces (MapObject, Scene, Keyframe, UnitEffect, NarrationEvent, OverlayEvent, UnitGroup, etc.)
│   └── services/
│       ├── timeline.ts        # Deterministic interpolation engine
│       ├── recording.ts       # Recording session management
│       ├── effects.ts         # Effect presets and factory
│       ├── serialization.ts   # Project JSON import/export
│       └── videoExport.ts     # Video export (planned)
│
├── store/
│   └── editorStore.ts         # Zustand store — all editor state and actions
│
├── pages/
│   └── Index.tsx              # Main editor layout + narration overlay renderer
│
├── components/editor/
│   ├── MapCanvas.tsx          # Konva canvas — units, effects, drag-drop, panning
│   ├── Toolbar.tsx            # Top toolbar (tools, record, import/export)
│   ├── AssetLibrary.tsx       # Left panel — unit palette + draggable effect presets
│   ├── PropertiesPanel.tsx    # Right panel — unit editor, narration editor, overlay editor, group management
│   ├── TimelinePanel.tsx      # Bottom panel — playback, tracks, draggable effect/narration/overlay blocks
│   └── UnitIcon.tsx           # NATO-style unit icon renderer
│
└── components/ui/             # shadcn/ui primitives
```

---

## Running Locally

```sh
git clone <REPO_URL>
cd <PROJECT_DIR>
npm install
npm run dev
```

---

## Keyboard & Mouse Controls

| Action | Control |
|---|---|
| Pan canvas | Middle mouse button drag |
| Zoom | Scroll wheel |
| Select unit | Left click |
| Multi-select | Shift + left click |
| Deselect all | Click empty canvas |
| Drag unit | Left click + drag (when Select tool active) |
| Move group | Drag any selected unit (moves all selected) |

---

## Planned Features

- WebM/MP4 video export via `canvas.captureStream()` + `MediaRecorder`
- Formation movement with maintained relative offsets
- Undo/redo system
- Audio narration track with voice recording
- Multi-scene editing with transitions
- More effect types (rain, fog, arrows/projectiles)
