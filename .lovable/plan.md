

# Plan: Recording UX Overhaul, Tooltips, and README Update

## 1. Improve Recording UX (Toolbar.tsx)

**Current problems:**
- "Record" button doesn't clearly explain what it does — users don't know if it records one unit or multiple
- The number input next to it just says "sec" with no context — unclear what "duration" means
- When recording, the hint text is small and easy to miss
- "Duration" label next to scene duration is ambiguous (scene length vs recording length)

**Changes:**
- Rename "Duration" (scene duration) to **"Scene Length"** to disambiguate
- Replace the bare `sec` label next to record input with **"Record Duration"** — how long the movement takes on playback
- Add a more prominent recording state indicator: show which units have been moved, with a count badge
- When not recording, show a brief explanation: **"Select units, press Record, then drag them. Movement plays back over the set duration."**
- When recording, show: **"🔴 Recording — drag units to capture movement ({n} unit(s) moved)"** — pull `movedObjectIds.size` from `recordingSession`
- Add a visual step indicator: "① Set duration → ② Click Record → ③ Drag units → ④ Stop"

## 2. Add Tooltips (Toolbar.tsx, TimelinePanel.tsx, AssetLibrary.tsx, PropertiesPanel.tsx)

Use the existing `Tooltip`/`TooltipProvider` from shadcn. Add tooltips to:

**Toolbar:**
- Select tool: "Select and move units on the canvas"
- Arrow tool: "Draw arrows between points"
- Path tool: "Draw movement paths — click waypoints, right-click to save, Esc to cancel"
- Record button: "Record unit movement. Drag units while recording to create keyframe animations"
- Record duration input: "How many seconds the recorded movement takes during playback"
- Scene Length input: "Total length of the scene/video in seconds"
- Delete: "Delete selected objects (also works with Ctrl+C/V)"
- Import/Export/Video buttons: already have titles, upgrade to proper Tooltip components

**Timeline:**
- Play/Pause/Skip buttons
- Lock toggle: "Lock timeline ruler position"
- Zoom +/-: "Zoom timeline in/out"
- "+ Track" button: "Add narration, overlay, or sound track"

**Asset Library:**
- Tab headers
- Unit icons on hover: show unit type name
- Effect presets: show effect description

## 3. Update README.md

Add sections for:
- New static icons (structures, props, terrain) with collapsible categories
- Copy/Paste (Ctrl+C/V)
- Canvas right-click "Add" menu
- Delete confirmation dialogs
- Continuous timeline scrubbing
- Effect tracks overlay on unit rows
- Enhanced visual effects
- Updated keyboard shortcuts table

## Files to Change

1. **`src/components/editor/Toolbar.tsx`** — Recording UX rewrite, tooltips on all buttons, rename "Duration" to "Scene Length"
2. **`src/components/editor/TimelinePanel.tsx`** — Tooltips on playback controls, lock, zoom, add track
3. **`src/components/editor/AssetLibrary.tsx`** — Tooltips on unit/effect items
4. **`src/components/editor/PropertiesPanel.tsx`** — Tooltips on key actions
5. **`README.md`** — Full update with all new features

