

# Plan: Flag Fix, Recording/Path UX, Multi-Select Keyframes, Start Menu

## Summary

Six changes: regenerate the flag icon, add a project start menu, clarify the recording and path tool UX, add shift-select for keyframe dots, and fix a duplicate button bug.

---

## 1. Regenerate Flag Icon (no white background)

Regenerate `src/assets/icons/flag.png` using AI image generation with explicit "transparent background, no white border" in the prompt. Style: Bulgarian "Свобода или смърт" revolutionary flag, isometric, matching other icons.

**Files:** `src/assets/icons/flag.png`

---

## 2. Project Start Menu

Add a start screen that shows before the editor. Options:
- **New Project** — starts fresh (current behavior)
- **Load Project** — opens file picker for JSON import

Simple state in `Index.tsx`: if no project loaded yet, show menu; otherwise show editor. Store a `projectStarted` boolean. When user picks "New" or imports, flip to editor view.

**Files:** `src/pages/Index.tsx`

---

## 3. Recording UX Rewrite (Toolbar)

Current problem: "Playback" label and the number input are confusing. Users don't understand what gets recorded or for how long.

Changes to the record section in `Toolbar.tsx`:
- Replace label "Playback" → **"Record"** with inline text: `Record [__] sec for moved units`
- When recording is active, show: `"🔴 Recording — drag units now (X moved) — stops and creates keyframes"`
- The time range shows: `"at 2.0s → 4.0s on timeline"`
- Button text: not recording = **"⏺ Record"**, recording = **"⏹ Stop & Save"**

This makes it explicit: you set how many seconds, press record, drag units, and when you stop it saves keyframes covering that duration.

**Files:** `src/components/editor/Toolbar.tsx`

---

## 4. Path Tool UX Clarification

Current problem: path tool silently uses the "record duration" input to spread waypoints, but nothing tells the user this.

Changes:
- When path tool is active, the status bar on the canvas already shows instructions. Update it to also show: `"Path duration: Xs (change in toolbar)"`  
- In the toolbar, when path tool is active, highlight the duration input and add a small label: `"Path will animate over [__] sec"`
- In `MapCanvas.tsx` path status text, include the duration info

**Files:** `src/components/editor/MapCanvas.tsx`, `src/components/editor/Toolbar.tsx`

---

## 5. Shift-Select Keyframe Dots on Timeline

Allow shift+click on keyframe dots to build a multi-selection set. When multiple keyframes are selected, dragging any of them moves all selected keyframes together, preserving relative time offsets.

Implementation:
- Add `selectedKeyframeIndices` state (array of `{objectId, index}`) to replace single `selectedKeyframeIndex` in the store — or simpler: keep it in TimelinePanel local state as `Set<string>` keyed by `"objectId:index"`
- Shift+click on a keyframe dot adds/removes it from the set
- Regular click replaces the set with just that one
- On drag of any selected keyframe, compute delta and apply to all selected keyframes via `updateKeyframe`
- Visual: selected keyframes get the highlighted style

Store change: add `selectedKeyframeIndices: {objectId: string; index: number}[]` to `EditorState`, with `setSelectedKeyframeIndices` and `toggleKeyframeSelection` actions.

**Files:** `src/store/editorStore.ts`, `src/components/editor/TimelinePanel.tsx`

---

## 6. Bug Fix: Duplicate SkipForward Button

Line 326 in `TimelinePanel.tsx` has a duplicate `<button onClick={() => seekTo(totalDuration)}>` (SkipForward) — remove it.

**Files:** `src/components/editor/TimelinePanel.tsx`

---

## 7. Local Images Question

Yes, if running locally, images placed in `src/assets/icons/` and imported in `index.ts` will work. Vite bundles them at build time. The current setup already handles this — any PNG in that folder just needs an import line added to `src/assets/icons/index.ts`.

---

## Files Changed

1. `src/assets/icons/flag.png` — regenerated
2. `src/pages/Index.tsx` — start menu screen
3. `src/components/editor/Toolbar.tsx` — recording + path UX labels
4. `src/components/editor/MapCanvas.tsx` — path status text with duration
5. `src/store/editorStore.ts` — multi-select keyframes state
6. `src/components/editor/TimelinePanel.tsx` — shift-select keyframes, fix duplicate button

