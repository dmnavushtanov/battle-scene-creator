# Battle Map Builder & Timeline Animator

A browser-only tactical battle map editor for creating animated military-style visualizations — similar to YouTube battle recap videos. Place unit icons on a map, record their movements in real-time, and play back the full animation on a timeline. Everything runs client-side with no server or database required.

## What It Does

- **Canvas Editor** — Load a background map image (user upload), then drag-and-drop military unit icons (infantry, cavalry, armor, artillery, naval, air, HQ, supply) onto a Konva.js stage with grid overlay, zoom, and pan.
- **Record Movement** — Click **Record**, drag one or more units to new positions, then click **Stop**. The app captures start/end keyframes with timing so all moved units animate together on playback.
- **Timeline Playback** — A bottom timeline panel with a playhead, play/pause controls, and per-unit keyframe tracks. Units interpolate linearly between keyframes during playback.
- **Properties Panel** — Edit position, rotation, scale, and visibility of selected units. Manually insert keyframes at the current playhead time.
- **Project Persistence** — Export the entire project (objects, keyframes, scenes) as a JSON file. Import it back later to continue editing.
- **Scene Management** — Projects support multiple scenes with configurable durations (extensible for future scene-based editing).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Canvas / Rendering | Konva.js via `react-konva` (multi-layer stage, transforms, drag-and-drop) |
| State Management | Zustand (single store: project data, selection, timeline, recording state) |
| Styling | Tailwind CSS with custom military/tactical design tokens (amber, olive, charcoal palette) |
| UI Components | shadcn/ui (Radix primitives) |
| Icons | Lucide React |
| Routing | React Router DOM |
| Hosting | Static site — deployable to GitHub Pages or any CDN |

## Data Model

All project data is a single JSON structure:

- **`ProjectData`** — name, canvas dimensions, background image URL, arrays of objects/keyframes/scenes.
- **`MapObject`** — each unit or drawing on the canvas (type, position, rotation, scale, layer, visibility).
- **`Keyframe`** — ties an object ID to a timestamp with position/rotation/scale values. Linear interpolation between keyframes drives playback.
- **`Scene`** — named time segments with duration and ordering.

## Architecture

```
src/
├── types/editor.ts          # TypeScript interfaces (MapObject, Keyframe, Scene, EditorState)
├── store/editorStore.ts     # Zustand store with all actions (CRUD, recording, playback, import/export)
├── pages/Index.tsx           # Main editor layout (header, toolbar, 3-column + timeline)
└── components/editor/
    ├── MapCanvas.tsx         # Konva Stage with grid, background, unit rendering, drag handlers
    ├── Toolbar.tsx           # Tool selection, record/stop, delete, import/export buttons
    ├── AssetLibrary.tsx      # Unit palette + map upload
    ├── PropertiesPanel.tsx   # Transform editors + manual keyframe insertion
    ├── TimelinePanel.tsx     # Playhead, play/pause, time ruler, keyframe tracks with interpolation
    └── UnitIcon.tsx          # SVG NATO-style military unit symbols
```

## Running Locally

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

## Planned Features

- Drawing tools (arrows, lines, freehand paths) on canvas
- Effects layer (explosions, gunfire sprites/Lottie at specific timestamps)
- WebM video export via `canvas.captureStream()` + `MediaRecorder`
- Formation movement (select group, move lead unit, others maintain relative offsets)
- Multiple recording layers at the same timestamp
- Audio triggers (WebAudio) for sound effects
- AI-assisted movement generation from text prompts
- Narration text tracks and subtitles
