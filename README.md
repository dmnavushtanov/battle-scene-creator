# Battle Map Builder & Timeline Animator

Create cinematic animated battle maps right in your browser — no installs, no accounts, no servers. Place military units, medieval buildings, and terrain on a canvas, record their movements, add visual effects like explosions and fire, layer narration and sound, then export the whole thing as a video. Think of it as a lightweight After Effects for tactical battle visualizations: drag units onto a map, hit Record to capture movement, scrub the timeline, and play back a polished animation. Perfect for history YouTubers, tabletop RPG recaps, strategy game breakdowns, or anyone who wants to turn a battle plan into a shareable video — entirely client-side with zero setup.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Canvas | Konva.js via `react-konva` |
| State | Zustand |
| Styling | Tailwind CSS + custom design tokens |
| UI | shadcn/ui (Radix primitives) |
| Icons | Lucide React |

---

## Features

### Canvas Editor
- Upload background map images
- Place units via drag-and-drop or right-click context menu
- Grid overlay, scroll-wheel zoom, middle-mouse pan
- Custom icon upload (auto-resized, max 200KB)
- Click empty canvas to deselect; Escape key also deselects
- Path tool: click waypoints, right-click to save, Escape to cancel

### Asset Library (Collapsible Categories)

| Category | Items |
|---|---|
| Military | Infantry, Cavalry, Armor, Artillery, Naval, Air, HQ, Supply |
| Structures | House, Castle, Tower, Church, Tavern, Windmill, Bridge, Gate |
| Props | Barrel, Haystack, Cart, Chest, Well, Campfire, Tent, Flag |
| Terrain | Tree, Rock, Mountain, River |
| Custom | Your uploaded icons |

### Effects (Drag-and-Drop)

| Effect | Visual |
|---|---|
| Explosion | Shockwave rings + debris particles |
| Shake | Screen shake offset |
| Crack | Shattered glass with refraction |
| Blood | Organic splatters with drip trails |
| Smoke | Volumetric turbulence clouds |
| Fire | Layered flames + rising embers |
| Gunshot | Muzzle flash + smoke puff |

### Recording & Playback
- Set playback duration → Record → Drag units → Stop
- Live counter shows how many units moved during recording
- Path tool creates keyframes without Record mode
- Shift-click for multi-select group drag
- Deterministic `requestAnimationFrame` playback with linear interpolation

### Timeline
- Resizable panel with zoomable tracks (25%–400%)
- Click ruler to seek (pauses playback, updates all positions)
- Dynamic narration, overlay, and sound tracks (hidden when empty)
- Inline effect bars on unit rows — draggable and resizable
- Delete confirmation on all destructive actions

### Narration & Overlays
- Text captions with position, font, animation (fade/typewriter/slide-up)
- Voice recording via microphone
- Full-screen image overlays with blur/dim backgrounds
- Live preview when editing (not during playback)

### Groups
- Shift-click multiple units → create named, color-coded group
- Right-click context menu to add/remove from groups
- "Select All" to grab entire group

### Copy & Paste
- Ctrl+C copies selected unit (with keyframes and effects) or selected effect
- Ctrl+V pastes at offset position or onto currently selected unit

### Tooltips & UX
- Rich tooltips on all toolbar and timeline controls
- Info button with quick-reference keyboard guide
- "Scene Length" and "Playback Duration" labels to avoid confusion
- Step-by-step recording tooltip: ① Set duration → ② Record → ③ Drag → ④ Stop

### Keyboard & Mouse

| Action | Control |
|---|---|
| Pan | Middle mouse drag |
| Zoom | Scroll wheel |
| Select | Left click |
| Multi-select | Shift + click |
| Deselect | Click empty canvas / Escape |
| Copy | Ctrl+C |
| Paste | Ctrl+V |
| Right-click unit | Context menu |
| Right-click canvas | Quick-add menu |
| Path: add point | Left click (Path tool) |
| Path: save | Right-click |
| Path: cancel | Escape |

### Export
- Project JSON (versioned, with import migration)
- WebM video via `canvas.captureStream()` + `MediaRecorder`

---

## Architecture

```
src/
├── domain/
│   ├── models.ts           # TypeScript interfaces
│   ├── constants.ts        # Unit symbols, colors, categories
│   ├── formatters.ts       # Time formatting
│   └── services/
│       ├── timeline.ts     # Keyframe interpolation
│       ├── recording.ts    # Recording session logic
│       ├── effects.ts      # Effect presets and utilities
│       ├── serialization.ts# JSON import/export
│       └── videoExport.ts  # WebM export
├── store/
│   └── editorStore.ts      # Zustand store (state + actions + clipboard)
├── pages/
│   └── Index.tsx            # Main layout
├── components/editor/
│   ├── MapCanvas.tsx        # Konva canvas, drag-drop, context menu, Ctrl+C/V
│   ├── Toolbar.tsx          # Tools, recording UX, tooltips
│   ├── AssetLibrary.tsx     # Collapsible asset categories
│   ├── PropertiesPanel.tsx  # Object properties, effects, keyframes
│   ├── TimelinePanel.tsx    # Timeline tracks, delete confirmation
│   ├── UnitIcon.tsx         # Icon renderer
│   ├── NarrationOverlay.tsx # HTML overlay for narration/sound playback
│   ├── effects/             # Konva visual effect components
│   └── properties/          # Sub-editors (keyframe, narration, overlay, group)
└── components/ui/           # shadcn/ui primitives
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

## Planned

- Undo/redo
- Multi-scene editing with transitions
- More effects (rain, fog, projectiles)
- Space to play/pause, Delete to remove
