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
- Place unit icons on a Konva stage — military, structures, props, and terrain
- **Drag-and-drop** from sidebar onto canvas (or click to add at random position)
- Grid overlay, zoom (scroll wheel), pan (**middle mouse button** only)
- Upload custom unit icons (auto-resized, max 200KB)
- **Click-away deselection** — left-click on empty canvas deselects all; **Escape key** also deselects
- **Right-click canvas** — context menu to quickly add units, structures, or effects at cursor position
- **Path tool** — right-click a unit → "Draw Path", click waypoints, right-click to save, Escape to cancel

### Expanded Asset Library (Collapsible Categories)

The asset library organizes all placeable objects into collapsible sections:

| Category | Items |
|---|---|
| **Military Units** | Infantry, Cavalry, Armor, Artillery, Naval, Air, HQ, Supply |
| **Structures** | House 🏠, Castle 🏰, Tower 🗼, Church ⛪, Tavern 🍺, Windmill 🌬️, Bridge 🌉, Gate 🚪 |
| **Props** | Barrel 🛢️, Haystack 🌾, Cart 🛒, Chest 📦, Well ⛲, Campfire 🔥, Tent ⛺, Flag 🏴 |
| **Terrain** | Tree 🌲, Rock 🪨, Mountain ⛰️, River 🌊 |
| **My Icons** | Custom uploaded images |

### Path Drawing
- **Activate**: Via toolbar Path button OR right-click context menu on a unit → "Draw Path"
- **Add waypoints**: Left-click on canvas to place points
- **Save path**: Right-click to finalize waypoints as keyframes
- **Cancel**: Press Escape to cancel and discard waypoints
- **Status bar**: Shows instructions during drawing
- **Auto-switch**: Returns to Select tool after saving a path

### Effects System
- **7 effect types**: Shake, Explosion, Crack (shattered glass), Blood, Smoke, Fire, Gunshot
- **Drag-and-drop only**: Drag effect presets from the Effects tab onto units or empty canvas
- Effects attach to units with configurable start time, duration, and intensity
- **Cinematic visuals**: Explosions with shockwave rings, volumetric smoke, layered fire, organic blood splatters, shattered glass cracks with refraction highlights, musket muzzle flash
- **Persistent effects**: Crack and blood remain visible after the effect ends
- **Standalone map effects**: Drop effects on empty space for map-level effects
- **Effect badges**: Units with effects show colored indicator dots at all times

### Sound System
- **Upload audio files** (MP3, WAV, OGG, WebM) via the Sounds tab
- Sounds placed on a dedicated timeline track
- Audio plays during playback at configured start time and duration

### Narration & Overlay System
- **Narration track**: Text captions with configurable position, font, animation (fade/typewriter/slide-up), and colors
- **Voice recording**: Record narration audio via microphone
- **Overlay track**: Full-screen image cutaways with blur/dim background effects, titles, subtitles, transitions
- **Live overlay preview**: Shows on canvas when editing (not playing)
- **Click to edit**: Click timeline blocks to open editor in Properties panel

### Persistent Named Groups
- Select multiple units (shift-click) and create a named group
- Groups are color-coded and persist across sessions
- "Select All" to quickly select all group members
- **Right-click context menu**: Add/remove units from groups

### Recording & Playback
- **Record movement**: Set playback duration → Click Record → Drag units → Click Stop
- **Live feedback**: Shows count of moved units while recording (e.g., "3 units moved")
- **Step indicator**: Tooltip explains workflow: ① Set duration → ② Record → ③ Drag → ④ Stop
- **Path tool**: Separate workflow — creates keyframes without needing Record mode
- **Multi-select group drag**: Shift-click to select multiple, drag one to move all
- **Deterministic playback**: `requestAnimationFrame` loop with linear interpolation

### Copy & Paste (Ctrl+C / Ctrl+V)
- **Copy unit**: Ctrl+C copies selected unit with all keyframes and effects
- **Paste unit**: Ctrl+V creates a duplicate at offset position (+30px)
- **Copy effect**: When an effect is selected, Ctrl+C copies just that effect
- **Paste effect**: Pastes copied effect onto the currently selected unit

### Timeline Panel
- **Resizable**: Drag handle between canvas and timeline
- **Zoomable**: +/- buttons (25% to 400%)
- **Seeking pauses playback**: Clicking the ruler pauses and moves all units/effects to that time
- **Units update when seeking**: Units move to correct interpolated positions when scrubbing
- **Dynamic tracks**: Narration, Overlay, and Sound tracks hidden when empty
- **+ Track button**: Dropdown menu to add Narration, Overlay, or Sound tracks
- **Inline effect dots**: Effects shown as colored dots on unit timeline rows (clickable)
- **Sticky controls**: Play/pause/seek controls pinned at top
- **Delete confirmation**: All destructive actions prompt a confirmation dialog
- **Drag & resize**: All blocks can be moved and resized

### Properties Panel
- **Top section**: Type badge, label, effects, keyframes, groups (frequently edited)
- **Bottom section**: Position, rotation, scale, visibility, lock (less frequently edited)
- **Effect highlighting**: Clicking an effect dot on the timeline highlights it in the properties panel
- Narration/Overlay editors accessible by clicking timeline blocks
- **Collapsible**: Toggle button on canvas edge

### Tooltips & UX
- **Rich tooltips** on all toolbar buttons, timeline controls, and recording workflow
- **Info button**: Quick-reference guide for keyboard shortcuts and features
- **Scene Length** label (previously "Duration") clearly indicates total scene time
- **Playback Duration** label for recording duration clearly indicates animation playback time
- **Delete confirmation** on all destructive actions (units, keyframes, effects, tracks)

### Keyboard & Mouse Controls

| Action | Control |
|---|---|
| Pan canvas | Middle mouse button drag |
| Zoom | Scroll wheel |
| Select unit | Left click |
| Multi-select | Shift + left click |
| Deselect all | Click empty canvas OR press Escape |
| Drag unit | Left click + drag (Select tool) |
| Move group | Drag any selected unit |
| Copy selected | Ctrl + C |
| Paste | Ctrl + V |
| Right-click unit | Context menu (groups, draw path) |
| Right-click canvas | Quick-add menu (units, structures, effects) |
| Draw path: add point | Left click (Path tool active) |
| Draw path: save | Right-click |
| Draw path: cancel | Escape |
| Right-click keyframe | Delete keyframe |
| Timeline seek | Click ruler (pauses playback) |
| Timeline zoom | +/- buttons |
| Resize timeline | Drag handle |

### Import/Export
- Export entire project as versioned JSON
- Import restores everything with migration support
- **Video export**: WebM via `canvas.captureStream()` + `MediaRecorder`

---

## Architecture

```
src/
├── domain/
│   ├── models.ts              # TypeScript interfaces
│   ├── constants.ts           # Shared constants (unit symbols, colors, categories)
│   ├── formatters.ts          # Time formatting utilities
│   └── services/
│       ├── timeline.ts        # Deterministic interpolation engine
│       ├── recording.ts       # Recording session management
│       ├── effects.ts         # Effect presets, factory, utilities
│       ├── serialization.ts   # Project JSON import/export
│       └── videoExport.ts     # WebM video export
│
├── store/
│   └── editorStore.ts         # Zustand store — all state and actions (incl. clipboard)
│
├── pages/
│   └── Index.tsx              # Main editor layout
│
├── components/editor/
│   ├── MapCanvas.tsx          # Konva canvas — units, effects, drag-drop, context menu, path drawing, Ctrl+C/V
│   ├── Toolbar.tsx            # Top toolbar — tools, recording UX, tooltips, scene length
│   ├── AssetLibrary.tsx       # Left panel — collapsible categories, effects, sounds
│   ├── PropertiesPanel.tsx    # Right panel — effects/keyframes first, transform last
│   ├── TimelinePanel.tsx      # Bottom panel — tooltips, delete confirmation, dynamic tracks
│   ├── UnitIcon.tsx           # Unit icon renderer (military + structures + props + terrain)
│   ├── NarrationOverlay.tsx   # HTML overlay for narrations, overlays, sounds
│   ├── effects/               # Konva effect renderers
│   │   ├── CrackEffect.tsx
│   │   ├── BloodEffect.tsx
│   │   ├── ExplosionEffect.tsx
│   │   ├── SmokeEffect.tsx
│   │   ├── FireEffect.tsx
│   │   ├── GunshotEffect.tsx
│   │   └── index.ts
│   └── properties/
│       ├── KeyframeEditor.tsx
│       ├── NarrationEditor.tsx
│       ├── OverlayEditor.tsx
│       └── GroupSection.tsx
│
└── components/ui/             # shadcn/ui primitives
```

---

## Effect Mechanics

Effects are applied via **drag-and-drop only** from the Effects tab.

| Effect | Color | Visual |
|---|---|---|
| 💥 Explosion | #ff6600 | Shockwave rings + debris particles |
| 〰️ Shake | #ffaa00 | Screen shake offset |
| ⚡ Crack | #888888 | Shattered glass with refraction highlights |
| 🩸 Blood | #cc0000 | Organic splatters with drip trails |
| 💨 Smoke | #9e9e9e | Volumetric multi-frequency turbulence |
| 🔥 Fire | #ff4400 | Layered flames + rising embers |
| 🔫 Gunshot | #ffdd00 | Muzzle flash + smoke puff |

---

## Running Locally

```sh
git clone <REPO_URL>
cd <PROJECT_DIR>
npm install
npm run dev
```

---

## Planned Features

- Formation movement with maintained relative offsets
- Undo/redo system
- Multi-scene editing with transitions
- More effect types (rain, fog, arrows/projectiles)
- Keyboard shortcuts (Space to play/pause, Delete to remove)
