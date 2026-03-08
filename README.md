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
- Grid overlay, zoom (scroll wheel), pan (**middle mouse button** only)
- Upload custom unit icons (auto-resized, max 200KB)
- **Click-away deselection** — left-click on empty canvas to deselect all objects, narrations, and overlays

### Effects System
- **6 effect types**: Shake, Explosion, Crack, Blood, Smoke, Fire
- **Drag-and-drop only**: Drag effect presets from the Effects tab in the sidebar onto units or empty canvas
- Effects attach to units with configurable start time, duration, and intensity
- **Cinematic visuals**: Explosions with shockwave rings + debris particles, volumetric smoke with multi-frequency turbulence, layered fire with flickering flames + rising embers, organic blood splatters with drip trails, fracture webs with depth shading
- **Persistent effects**: Crack and blood remain visible after the effect ends
- **Standalone map effects**: Drop effects on empty space to create map-level effects (fire on terrain, etc.)
- **Effect badges**: Units with effects show colored indicator dots at all times, even outside playback
- **Color-coded timeline blocks**: Each effect type has a distinct color (orange for explosion, amber for shake, gray for crack, red for blood, silver for smoke, red-orange for fire)
- **Effects on unit tracks**: Effect blocks appear inline on each unit's timeline row, not in a separate track
- **Timeline control**: Drag effect blocks to reposition, resize edges to adjust start/duration

### Narration & Overlay System
- **Narration track**: Add text captions that appear during playback with configurable position, font, animation (fade/typewriter/slide-up), and colors
- **Overlay track**: Add full-screen image cutaways with blur/dim background effects, titles, subtitles, and transitions
- **Live overlay preview**: When editing an overlay (selected but not playing), it shows on the canvas with an "OVERLAY PREVIEW" badge
- **Click to edit**: Click narration/overlay blocks on the timeline to open their editor in the Properties panel
- **Resize & move**: Drag edges to adjust timing, drag center to reposition on timeline
- **Time in seconds**: All timing inputs use seconds, not milliseconds
- **Non-overlapping creation**: New narrations/overlays are placed after the last existing one to avoid overlap

### Persistent Named Groups
- Select multiple units (shift-click) and create a named group
- Groups are color-coded and persist across editing sessions
- Group badge shown on each member unit on the canvas
- "Select All" to quickly select all group members
- Add/remove individual units from existing groups via the Properties panel
- **Right-click context menu**: Right-click a unit to add it to an existing group or remove it
- Group members highlighted when any member is selected
- "Ungroup" button to dissolve a group

### Recording & Playback
- **Record movement**: Click Record, drag units, click Stop — captures start/end keyframes
- **Multi-select group drag**: Shift-click to select multiple units, drag one to move all
- **Deterministic playback**: `requestAnimationFrame` loop with linear interpolation between keyframes
- **Timeline panel**: Play/pause, time scrub, per-object keyframe markers

### Timeline Panel
- **Resizable**: The timeline panel height is adjustable via a drag handle between the canvas and timeline
- **Zoomable**: +/- buttons in the controls bar to manually scale the timeline width (25% to 400%)
- **Sticky controls**: Play/pause/seek controls stay pinned at the top when scrolling tracks
- **Narration & overlay tracks**: Dedicated rows with + buttons to add new events
- **Unit tracks**: Each unit shows keyframe markers and inline color-coded effect blocks
- **Drag & resize**: All blocks (narrations, overlays, effects) can be moved by dragging the center and resized by dragging the edges

### Properties Panel
- Edit position, rotation, scale, visibility, lock for selected units
- Add/remove keyframes at playhead time
- Manage effects per unit (add via dropdown, view list, remove individually)
- Create and manage groups with member list
- Narration editor: text, position, font, animation, colors, timing
- Overlay editor: image upload, title/subtitle, background effect, transition, timing
- **Collapsible**: Toggle button always visible on the edge of the canvas

### Layout
- **Resizable panels**: Bottom timeline panel is vertically resizable
- **Collapsible side panels**: Both left (asset library) and right (properties) panels have always-visible toggle buttons
- **Left panel**: Asset library with Units and Effects tabs
- **Right panel**: Context-sensitive properties editor

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
│   ├── MapCanvas.tsx          # Konva canvas — units, effects, drag-drop, panning, context menu
│   ├── Toolbar.tsx            # Top toolbar (tools, record, import/export)
│   ├── AssetLibrary.tsx       # Left panel — unit palette + draggable effect presets
│   ├── PropertiesPanel.tsx    # Right panel — unit editor, narration editor, overlay editor, group management
│   ├── TimelinePanel.tsx      # Bottom panel — playback, tracks, draggable effect/narration/overlay blocks, zoom controls
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
| Deselect all | Click empty canvas (left click) |
| Drag unit | Left click + drag (when Select tool active) |
| Move group | Drag any selected unit (moves all selected) |
| Right-click unit | Context menu (add to group, remove from group) |
| Timeline zoom | +/- buttons in timeline controls bar |
| Resize timeline | Drag the handle between canvas and timeline |

---

## Effect Mechanics

Effects are applied to units via **drag-and-drop only**:
1. Open the **Effects** tab in the left sidebar
2. Drag an effect preset onto a unit on the canvas → adds the effect to that unit
3. Drag an effect preset onto empty canvas space → creates a standalone map effect object

Each effect type has a **distinct color** on the timeline:
- 💥 Explosion → Orange (#ff6600)
- 〰️ Shake → Amber (#ffaa00)
- ⚡ Crack → Gray (#888888)
- 🩸 Blood → Dark Red (#cc0000)
- 💨 Smoke → Silver (#9e9e9e)
- 🔥 Fire → Red-Orange (#ff4400)

Units with effects show **colored indicator dots** on the canvas at all times.

---

## Planned Features

- WebM/MP4 video export via `canvas.captureStream()` + `MediaRecorder`
- Formation movement with maintained relative offsets
- Undo/redo system
- Audio narration track with voice recording
- Multi-scene editing with transitions
- More effect types (rain, fog, arrows/projectiles)
- Keyboard shortcuts (Space to play/pause, Delete to remove, etc.)
