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
- **Drag-and-drop units** from the sidebar onto the canvas (or click to add at random position)
- Grid overlay, zoom (scroll wheel), pan (**middle mouse button** only)
- Upload custom unit icons (auto-resized, max 200KB)
- **Click-away deselection** — left-click on empty canvas to deselect all objects, narrations, and overlays
- **Path tool** — click waypoints on the canvas, double-click to finalize as keyframes for the selected unit

### Effects System
- **7 effect types**: Shake, Explosion, Crack, Blood, Smoke, Fire, Gunshot
- **Drag-and-drop only**: Drag effect presets from the Effects tab in the sidebar onto units or empty canvas
- Effects attach to units with configurable start time, duration, and intensity
- **Cinematic visuals**: Explosions with shockwave rings + debris particles, volumetric smoke with multi-frequency turbulence, layered fire with flickering flames + rising embers, organic blood splatters with drip trails, fracture webs with depth shading, musket muzzle flash with smoke puff
- **Persistent effects**: Crack and blood remain visible after the effect ends
- **Standalone map effects**: Drop effects on empty space to create map-level effects (fire on terrain, etc.)
- **Hidden during playback**: Standalone effect placeholders (labels, circles) are hidden during playback — only the visual effects show
- **Effect badges**: Units with effects show colored indicator dots at all times, even outside playback

### Sound System
- **Upload audio files** (MP3, WAV, OGG, WebM) via the Sounds tab in the sidebar
- Sounds are placed on a dedicated timeline track
- Audio plays during playback at the configured start time and duration
- Drag and resize sound blocks on the timeline

### Narration & Overlay System
- **Narration track**: Add text captions that appear during playback with configurable position, font, animation (fade/typewriter/slide-up), and colors
- **Voice recording**: Record narration audio directly in the browser via microphone
- **Overlay track**: Add full-screen image cutaways with blur/dim background effects, titles, subtitles, and transitions
- **Live overlay preview**: When editing an overlay (selected but not playing), it shows on the canvas with an "OVERLAY PREVIEW" badge
- **Click to edit**: Click narration/overlay blocks on the timeline to open their editor in the Properties panel
- **Resize & move**: Drag edges to adjust timing, drag center to reposition on timeline

### Persistent Named Groups
- Select multiple units (shift-click) and create a named group
- Groups are color-coded and persist across editing sessions
- Group badge shown on each member unit on the canvas
- "Select All" to quickly select all group members
- Add/remove individual units from existing groups via the Properties panel
- **Right-click context menu**: Right-click a unit to add it to an existing group or remove it

### Recording & Playback
- **Record movement**: Click Record, drag units, click Stop — captures start/end keyframes
- **Path tool**: Click waypoints on the canvas, double-click to create evenly-spaced keyframes along the path
- **Multi-select group drag**: Shift-click to select multiple units, drag one to move all
- **Deterministic playback**: `requestAnimationFrame` loop with linear interpolation between keyframes

### Keyframe Editing
- **Clickable keyframes**: Click keyframe diamonds on the timeline to select and edit in the Properties panel
- **Draggable keyframes**: Drag keyframe diamonds left/right to adjust timing
- **Right-click to delete**: Right-click a keyframe on the timeline to remove it
- **Property editing**: Edit time, position, rotation, and scale for individual keyframes

### Timeline Panel
- **Resizable**: The timeline panel height is adjustable via a drag handle between the canvas and timeline
- **Zoomable**: +/- buttons to scale the timeline width (25% to 400%)
- **Sticky controls**: Play/pause/seek controls stay pinned at the top when scrolling tracks
- **Narration, overlay, and sound tracks**: Dedicated rows with + buttons to add new events
- **Unit tracks**: Each unit shows keyframe markers and inline color-coded effect blocks
- **Standalone effects section**: Map effects grouped by type with collapsible rows
- **Delete track**: Trash icon on each unit row with confirmation dialog
- **Drag & resize**: All blocks (narrations, overlays, effects, sounds) can be moved and resized

### Properties Panel
- Edit position, rotation, scale, visibility, lock for selected units
- Add/remove keyframes at playhead time
- **Keyframe editor**: Select and edit individual keyframe properties
- Manage effects per unit (add via dropdown, view list, remove individually)
- Create and manage groups with member list
- Narration editor: text, position, font, animation, colors, timing, voice recording
- Overlay editor: image upload, title/subtitle, background effect, transition, timing
- **Collapsible**: Toggle button always visible on the edge of the canvas

### Import/Export
- Export entire project as versioned JSON
- Import restores everything with migration support
- **Video export**: WebM export via `canvas.captureStream()` + `MediaRecorder` with narration text rendered on canvas

---

## Architecture

```
src/
├── domain/
│   ├── models.ts              # TypeScript interfaces (MapObject, Scene, Keyframe, UnitEffect, NarrationEvent, OverlayEvent, SoundEvent, UnitGroup, etc.)
│   ├── constants.ts           # Shared constants (EFFECT_COLORS, UNIT_SYMBOLS, GROUP_COLORS, etc.)
│   ├── formatters.ts          # Time formatting utilities (formatTime, formatTimeSec)
│   └── services/
│       ├── timeline.ts        # Deterministic interpolation engine
│       ├── recording.ts       # Recording session management
│       ├── effects.ts         # Effect presets, factory, getShakeOffset, seededRandom
│       ├── serialization.ts   # Project JSON import/export
│       └── videoExport.ts     # WebM video export with narration rendering
│
├── store/
│   └── editorStore.ts         # Zustand store — all editor state and actions
│
├── pages/
│   └── Index.tsx              # Main editor layout (imports NarrationOverlay)
│
├── components/editor/
│   ├── MapCanvas.tsx          # Konva canvas — units, effects, drag-drop, panning, context menu
│   ├── Toolbar.tsx            # Top toolbar (tools, record, import/export)
│   ├── AssetLibrary.tsx       # Left panel — unit palette, effect presets, sound upload
│   ├── PropertiesPanel.tsx    # Right panel — orchestrator for sub-editors
│   ├── TimelinePanel.tsx      # Bottom panel — playback, tracks, draggable blocks, zoom controls
│   ├── UnitIcon.tsx           # NATO-style unit icon renderer
│   ├── NarrationOverlay.tsx   # HTML overlay for narrations, overlays, and sound playback
│   ├── effects/               # Extracted Konva effect renderers
│   │   ├── CrackEffect.tsx
│   │   ├── BloodEffect.tsx
│   │   ├── ExplosionEffect.tsx
│   │   ├── SmokeEffect.tsx
│   │   ├── FireEffect.tsx
│   │   ├── GunshotEffect.tsx
│   │   └── index.ts
│   └── properties/            # Extracted property panel sub-editors
│       ├── KeyframeEditor.tsx
│       ├── NarrationEditor.tsx
│       ├── OverlayEditor.tsx
│       └── GroupSection.tsx
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
| Right-click keyframe | Delete keyframe |
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
- 🔫 Gunshot → Yellow (#ffdd00)

Units with effects show **colored indicator dots** on the canvas at all times.

---

## Planned Features

- Formation movement with maintained relative offsets
- Undo/redo system
- Multi-scene editing with transitions
- More effect types (rain, fog, arrows/projectiles)
- Keyboard shortcuts (Space to play/pause, Delete to remove, etc.)
