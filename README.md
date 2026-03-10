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

## Engineering Philosophy

This project adheres to a **Senior Engineer Philosophy**: **Simple code is better than clever code.**

1.  **Clarity over Cleverness:** Logic should be instantly understandable, avoiding advanced syntax tricks that hinder debugging.
2.  **Explicit > Hidden:** Avoid "magic" abstractions. Prefer step-by-step logic that can be traced easily.
3.  **Debuggability First:** Every major state transition (recording, importing, movement) is logged via a structured `Logger` utility.
4.  **Small Modules:** Large components are broken down into focused hooks and sub-components (Single Responsibility Principle).
5.  **Fail Fast:** Configuration or state errors throw clear, descriptive exceptions rather than failing silently.

---

## Features

### Project Management
- **Start Menu**: New Project or Load Project (JSON import) on launch
- **File Menu**: Hamburger menu in the editor header — start a new project or load a saved one at any time
- **JSON Import/Export**: Versioned project files with migration support

### Canvas Editor
- Upload background map images
- Place units via drag-and-drop or right-click context menu
- Grid overlay, scroll-wheel zoom, middle-mouse pan
- Custom icon upload (auto-resized, max 200KB)
- Custom effect media upload (images + short videos), draggable from Effects tab
- Click empty canvas to deselect; Escape key also deselects
- **Rectangle marquee selection**: Left-click drag on empty canvas to draw a selection box — all units inside are selected on release
- Path tool: click waypoints, right-click to save, Escape to cancel
- Path recording starts at the moment the unit becomes visible (`max(currentTime, unit start time)`) so hidden units do not move invisibly before appearing
- Path tool shows duration info: "Path duration: Xs (change in toolbar)"

### Asset Library (Collapsible Categories)

| Category | Items |
|---|---|
| Military | Infantry, Cavalry, Armor, Artillery, Naval, Air, HQ, Supply |
| Structures | House, Castle, Tower, Church, Tavern, Windmill, Bridge, Gate, Farm |
| Fortifications | Fence, Wooden Barricade, Stone Barricade, Pathway |
| Props | Barrel, Haystack, Cart, Chest, Well, Campfire, Tent, Flag |
| Terrain | Tree, Rock, Mountain, River |
| Custom | Your uploaded icons |

All icons are 18th-century Bulgarian military style, transparent PNG, isometric perspective.

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
| Custom Media Effect | Upload your own image/video effect and place/drag it on the map |

### Animated Arrows
- **Animated Arrow tool**: Draw arrows that progressively grow during playback — the #1 visual element in battle map videos (Kings and Generals style)
- Set start/end timing in properties panel
- Color-coded per faction
- Shows duration label on canvas in edit mode

### On-Map Text Labels
- **Text tool**: Click anywhere on the canvas to place text labels — city names, dates, battle names, casualty counts
- Configurable font size, text color, and optional background color
- Draggable and keyframeable like any other object
- **Time Range + Fade controls** (for units and text): Set Visible From/Until, then use Fade In/Out in seconds to smooth opacity transitions (e.g., Visible Until 20s + Fade Out 3s starts fading at 17s)
- Perfect for annotating battle positions and key locations

### Faction Colors
- **8 preset faction colors**: Blue, Red, Green, Orange, Purple, Teal, Gold, White
- Assign to any unit or animated arrow via the properties panel
- Changes unit border/fill tint for instant visual distinction between sides
- "None" option to revert to default amber

### Recording & Playback
- **Clear recording UX**: "Record [n] sec for moved units" label, ⏺ Record / ⏹ Stop & Save buttons
- Live status during recording: "🔴 Recording — drag units now (X moved) — at 2.0s → 4.0s on timeline"
- Path tool creates keyframes without Record mode — shows path duration in toolbar & canvas
- Shift-click for multi-select group drag
- Deterministic `requestAnimationFrame` playback with linear interpolation

### Timeline
- Resizable panel with zoomable tracks (25%–400%)
- Click ruler to seek (pauses playback, updates all positions)
- Dynamic narration, overlay, and sound tracks (hidden when empty)
- Inline effect bars on unit rows — draggable and resizable
- **Shift-click keyframe dots** to multi-select; drag moves all selected together preserving relative offsets
- Delete confirmation on all destructive actions

### Narration & Overlays
- Text captions with position, font, animation (fade/typewriter/slide-up)
- Voice recording via microphone
- Full-screen image overlays with blur/dim backgrounds
- **Overlay transparency slider**: Fine-grained control (0–100%) over dim opacity so the map stays visible behind overlays
- Live preview when editing (not during playback)

### Groups
- Shift-click multiple units → create named, color-coded group
- Right-click context menu to add/remove from groups
- "Select All" to grab entire group — **drag moves all members together**, preserving formation
- **Group recording**: Record mode captures keyframes for all selected group members simultaneously
- Path drawing disabled for groups (single unit only) — clear message shown

### Copy & Paste
- Ctrl+C copies selected unit (with keyframes and effects) or selected effect
- Ctrl+V pastes at offset position or onto currently selected unit

### Selection
- Click to select one unit
- Shift+click to add/remove from selection
- **Rectangle drag selection**: Draw a box on empty canvas to select all enclosed units
- Groups: "Select All" selects every member for coordinated movement

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
| Rectangle select | Left-click drag on empty canvas |
| Deselect | Click empty canvas / Escape |
| Delete selected | Delete / Backspace |
| Play / Pause | Space bar |
| Copy | Ctrl+C |
| Paste | Ctrl+V |
| Right-click unit | Context menu |
| Right-click canvas | Quick-add menu |
| Path: add point | Left click (Path tool) |
| Path: save | Right-click |
| Path: cancel | Escape |

### Toolbar Tools

| Tool | Icon | Description |
|---|---|---|
| Select | Cursor | Select and move objects |
| Arrow | → | Draw static arrows |
| Anim Arrow | ↗ | Draw animated arrows that grow during playback |
| Path | Route | Draw movement paths for units |
| Text | T | Click to place text labels on the map |

### Export
- Project JSON (versioned, with import migration)
- WebM video via `canvas.captureStream()` + `MediaRecorder`

---

## Architecture

```
src/
├── domain/
│   ├── models.ts           # TypeScript interfaces
│   ├── constants.ts        # Unit symbols, colors, categories, faction colors
│   ├── formatters.ts       # Time formatting
│   └── services/
│       ├── timeline.ts     # Keyframe interpolation
│       ├── recording.ts    # Recording session logic
│       ├── effects.ts      # Effect presets and utilities
│       ├── serialization.ts# JSON import/export (with logging)
│       └── videoExport.ts  # WebM export (with logging)
├── store/
│   └── editorStore.ts      # Zustand store (with structured logging)
├── hooks/
│   ├── usePanZoom.ts       # Extracted logic for stage navigation
│   ├── useMarqueeSelection.ts # Extracted logic for rectangle selection
│   ├── usePathDrawing.ts   # Extracted logic for path-based movement
│   └── use-toast.ts        # UI feedback
├── utils/
│   ├── logger.ts           # Structured logging utility (Debug/Info/Warn/Error)
│   └── ids.ts              # ID generation
├── pages/
│   └── Index.tsx            # Start menu + main layout + file menu
├── components/editor/
│   ├── MapCanvas.tsx        # Lean Konva canvas (orchestrates interaction hooks)
│   ├── Toolbar.tsx          # Tools (select, arrow, anim arrow, path, text), recording UX
│   ├── AssetLibrary.tsx     # Collapsible asset categories
│   ├── PropertiesPanel.tsx  # Object properties, effects, keyframes, faction colors
│   ├── TimelinePanel.tsx    # Timeline tracks, shift-select keyframes, delete confirmation
│   ├── UnitIcon.tsx         # Icon renderer
│   ├── NarrationOverlay.tsx # HTML overlay for narration/sound playback
│   ├── effects/             # Konva visual effect components
│   └── properties/          # Sub-editors (keyframe, narration, overlay, group)
└── components/ui/           # shadcn/ui primitives
```

---

## AI Maintainer Guide (Mechanics + Editing Rules)

This section explains the behavior contracts behind selection, dragging, groups, timeline playback, recording, and export so future edits do not regress core UX.

### Debugging & Logging
- **Always use `src/utils/logger.ts`** instead of raw `console.log`.
- Log levels:
    - `info`: Major lifecycle events (Export started, Scene switched, Group created).
    - `debug`: High-frequency interactions (Object dragged, Zoomed, Keyframe added).
    - `warn`: Unexpected but recoverable states (Active scene not found, Empty clipboard paste).
    - `error`: Critical failures (Import failed, MediaRecorder error).

### Modularity Rules
- **Keep `MapCanvas.tsx` thin.** New interaction tools should be implemented as custom hooks in `src/hooks/`.
- **Domain logic stays in `src/domain/services/`.** The store should only orchestrate these services.

### State Model (Authoritative Data)

- Source of truth is `src/store/editorStore.ts` (Zustand).
- Scene structure:
  - `objectsById` + `objectOrder`
  - `keyframesByObjectId`
  - `effectsByObjectId`
  - `groups`
  - narration/overlay/sound arrays
- Rendering components (especially `MapCanvas.tsx`) read from the active scene plus editor flags (`isPlaying`, `isRecording`, `isVideoExporting`, `currentTime`).

### Core Interaction Mechanics

#### Select tool
- Click object: single select.
- Shift+click object: add/remove from selection.
- Click empty canvas: clear selection.
- Rectangle selection starts only on empty canvas (stage/background), updates during drag, and finalizes on mouse-up by overlap against object bounds.
- After marquee finalize, a click-suppression flag prevents immediate deselect caused by post-drag click events.

#### Pan/Zoom
- Middle mouse drag = pan.
- Wheel zoom is cursor-centered using stage-space coordinate conversion:
  - `stage = (screen - stagePosition) / stageScale`
- Keep all new pointer logic consistent with this conversion.

#### Context menu
- Right-click object: object menu (group actions, path action for units).
- Right-click empty canvas: quick-add units/effects menu.
- In path mode, right-click saves path instead of opening menu.

### Group Mechanics (Important)

- Group membership is exclusive by design:
  - Creating/adding to a group removes those members from any other group.
- `Select All` in group UI sets `selectedIds` to all members.
- Group drag contract:
  - One selected member is drag lead.
  - Every other selected member moves by the same delta.
  - Delta must be per-drag-step, not repeatedly applied from stale origins.
  - Drag session member IDs are captured at drag start and reused through drag end.

Critical implementation rule:
- Keep `derivedTransforms` synchronized while dragging (`onObjectDragMove`, `onGroupDragMove`) so later drags do not jump/stack due to stale derived positions.

### Timeline / Derived Transform Mechanics

- Timeline playback/scrubbing computes per-object transforms with `evaluateObjectAtTime(...)`.
- Results are cached in store as `derivedTransforms`, used by canvas rendering and export frame computation.
- If object positions are changed interactively, derived transforms for moved objects must be updated as well to keep visual state consistent.

### Recording Mechanics

- Recording session is created with:
  - `startTime = currentTime`
  - `durationMs = recordDurationSeconds * 1000`
- On first drag for an object during recording, its pre-drag snapshot is captured.
- Stop recording writes:
  - start keyframe at `startTime` from snapshot
  - end keyframe at `startTime + durationMs` from final object transform
- Existing keyframes in the recorded interval are replaced for moved objects.

### Path Tool Mechanics

- Path tool only works with exactly one selected unit.
- Path start time is `max(currentTime, unit.startTime)` to avoid hidden-unit movement before visibility.
- Saving a path replaces future keyframes from path start onward.
- Path duration equals toolbar `recordDurationSeconds`.

### Export Mechanics

- Export uses `canvas.captureStream()` + `MediaRecorder`.
- Export loop seeks to each frame time and applies evaluated transforms to Konva nodes.
- After export, restore previous editor time and recompute derived transforms.

### Safe Edit Checklist

When changing selection/drag/group code:
- Keep empty-canvas hit-testing working on both background rect and background image.
- Preserve marquee click suppression.
- Preserve drag lead + delta propagation model.
- Do not reintroduce stale-derived-position drift between consecutive group drags.

When changing timeline/recording:
- Preserve replacement semantics for keyframes in overwritten time ranges.
- Keep `currentTime`, `derivedTransforms`, and rendered node transforms synchronized.

When changing serialization/import:
- Maintain migration defaults (`groups`, `soundEvents`) for older JSON files.

---


## Deploying to GitHub Pages

This project is a Vite app, so the deployed site must serve the **build output** (`dist/`), not the raw `src/` files.

### 1) Repository structure
Keep `index.html` at the repository root (current setup). Do **not** move it under `src/`.

### 2) Pages settings
Go to **Repository → Settings → Pages** and set:
- **Source**: `GitHub Actions`

> If you instead choose **Deploy from branch**, GitHub will publish your source files and the app will not run correctly.

### 3) Workflow artifact
The workflow in `.github/workflows/deploy-github-pages.yml` uploads `./dist` (the folder that contains built `index.html`) to Pages.

### 4) Base path
When deployed from a project repository (for example `username.github.io/battle-scene-creator/`), Vite automatically uses `/battle-scene-creator/` as base path in GitHub Actions builds.

If the site is still 404ing, re-run the **Deploy to GitHub Pages** workflow and confirm the artifact contains `dist/index.html`.

---

## Running Locally

```sh
git clone <REPO_URL>
cd <PROJECT_DIR>
npm install
npm run dev
```

To add built-in assets locally, just drop files into the assets folders and they are auto-discovered at build time:
- Unit icons: `src/assets/icons/` (supports PNG, SVG, JPG/JPEG, WEBP, including nested folders)
- Background maps: `src/assets/maps/` (supports PNG, SVG, JPG/JPEG, WEBP)

No manual import edits are required.

Custom effects in the app can be uploaded from the **Effects** tab.

Supported upload formats:
- **Images**: PNG, JPG/JPEG, WEBP, SVG (max **1024KB**)
- **Videos**: WEBM, MP4, OGG (max **8192KB**)

Recommended for animated battle effects (explosions, muzzle flashes, smoke):
- **WEBM with alpha** (best quality + transparency for overlays)
- **Short MP4 loops** when transparency is not needed
- **Sprite-sheet PNG sequences** if you want deterministic frame control in future tooling

For best visual quality, keep clips short (0.3s–3s), tightly cropped to the effect area, and exported at square-ish dimensions (256–1024 px).

---

## Planned

- Undo/redo history stack
- Camera pan/zoom keyframes for cinematic playback
- Territory zone shading (colored polygons for faction control)
- Animated dashed lines (supply routes, marching ants)
- Unit strength/count labels with casualty animation
- Easing curves for keyframe interpolation
- Grid snapping for formation alignment
- Duplicate scene for sequential battle phases

---

## Deploy to GitHub Pages

This repository is configured for GitHub Pages with a workflow at:
- `.github/workflows/deploy-github-pages.yml`

### One-time setup in GitHub
1. Open **Settings → Pages** in your repository.
2. Under **Build and deployment**, choose **Source: GitHub Actions**.
3. Push to the `main` branch (or run the workflow manually from Actions).

### Notes
- The Vite `base` path is auto-detected during GitHub Actions builds:
  - `https://<user>.github.io/<repo>/` for project pages
  - `https://<user>.github.io/` for user/organization pages (`<user>.github.io` repo)
- A `404.html` SPA fallback is included so direct navigation to nested routes still works on GitHub Pages.
