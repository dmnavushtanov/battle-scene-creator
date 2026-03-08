

# Plan: Effect Cleanup, Video Export Fix, Sound Timeline, Unit Drag-Drop, Timeline UX

## Issues & Solutions

### 1. Standalone effect labels/arrows visible during playback
**Problem**: In `MapCanvas.tsx`, standalone effect objects (type `'effect'`) render their label text, timing info, circle border, and emoji even during playback. Only the actual visual effect should show.
**Fix**: Wrap the standalone effect placeholder rendering (lines 633-643) in a condition `!isPlaying`. During playback, only render the effect overlays (explosion, smoke, etc.), not the placeholder UI.

### 2. Video export only captures unit movement, not effects or text
**Problem**: `videoExport.ts` calls `computeFrame(time)` which updates `derivedTransforms` and `derivedEffects` in the store. However, `stage.toCanvas()` renders the Konva stage which does render effects. The issue is that `computeFrame` updates state, but the Konva stage doesn't re-render because React hasn't processed the state change — `stage.batchDraw()` redraws what's already on the canvas, but React-Konva nodes depend on React state.
**Fix**: In `computeFrame`, after calling `computeDerivedTransforms(time)`, we need to force a synchronous re-render. Since this is fundamentally a React timing issue, the better approach is to use `stage.toCanvas()` after a small delay, or better: render narration text directly on the Konva canvas during export (as HTML overlays won't appear in `stage.toCanvas()`). For effects: ensure `batchDraw()` is called after state is applied. For narrations: render them as Konva `Text` nodes in the export layer.

Actually, the real fix: The `computeFrame` callback likely calls `computeDerivedTransforms` which sets zustand state. But React-Konva only re-renders on React re-render cycles, not synchronously. The `stage.batchDraw()` just redraws the existing Konva nodes — it doesn't trigger React to update component props. So effects and text that depend on React state won't update.

**Better approach**: Add a dedicated Konva layer for export that renders effects and narration text imperatively (not through React). Or, use `flushSync` from react-dom to force synchronous renders before capturing. The simplest reliable fix: in the export loop, use `setTimeout` with enough delay for React to re-render, and ensure the Konva stage reflects the new state before capturing.

For narrations specifically: they're rendered as HTML overlays (`NarrationOverlay` component), not on the Konva canvas at all. They will never appear in `stage.toCanvas()`. Need to render narration text as Konva `Text` nodes during export.

### 3. Drag-drop units from sidebar (like effects)
**Fix**: In `AssetLibrary.tsx`, make unit buttons draggable with `onDragStart` setting `application/unit-type` data. In `MapCanvas.tsx` `handleDrop`, check for unit data and create the unit at the drop position.

### 4. Sound file upload + sound timeline
**Problem**: Need ability to upload audio files (not just record) and display them on a dedicated timeline track.
**Fix**: 
- Add `SoundEvent` model to `models.ts` with `id`, `startTime`, `duration`, `audioUrl`, `label`, `volume`.
- Add `soundEvents` array to `Scene`.
- Add CRUD for sounds in `editorStore.ts`.
- Add a Sound track in `TimelinePanel.tsx` (like narration track).
- Add upload UI in `PropertiesPanel.tsx` or `AssetLibrary.tsx`.
- Play sounds during playback in `Index.tsx`.

### 5. Effect collapse/expand bugs
**Problem**: Adding a new shake effect creates a new timeline row instead of grouping with existing shake effects. Also, the collapse toggle applies to unit rows too.
**Fix**: The collapsible effect sub-rows are already grouped by type (`getEffectsByType`). The issue is likely that `expandedEffects` tracks by `unitId`, and the expand/collapse chevron is on the unit row. The collapse should only affect effect sub-rows (which it does). Need to verify the grouping logic — when a new shake is added, it should go into the existing `shake` bucket in `effectsByType`. This should already work since `getEffectsByType` groups by `eff.type`. The bug might be that standalone effect objects (type `'effect'`) each get their own timeline row. Fix: standalone effects on the ground should have their own collapsible section separate from unit tracks.

### 6. Edit individual keyframes on unit movement
**Problem**: Currently can only clear all keyframes for a unit. Need to select and delete/edit individual keyframes.
**Fix**: Make keyframe diamonds on the timeline clickable. When clicked, show the keyframe's properties in PropertiesPanel (time, position). Add ability to delete individual keyframes. Add a `removeKeyframe` method to the store.

### 7. Improve movement editing UX on timeline
**Fix**: 
- Keyframe diamonds become draggable left/right to adjust timing.
- Clicking a keyframe selects it and shows its properties.
- Add `selectedKeyframe` state to store.
- Show keyframe details in PropertiesPanel when selected.

### 8. Delete entire timeline track
**Fix**: Add a delete button (trash icon) on each unit's timeline row. Clicking it shows a confirmation dialog. On confirm, call `removeObject(unit.id)`.

---

## Files to Change

1. **`src/domain/models.ts`** — Add `SoundEvent` interface, add `soundEvents` to `Scene`
2. **`src/store/editorStore.ts`** — Add sound CRUD, add `removeKeyframe`, add `selectedKeyframeId` state
3. **`src/components/editor/MapCanvas.tsx`** — Hide standalone effect UI during playback, handle unit drag-drop from sidebar
4. **`src/components/editor/AssetLibrary.tsx`** — Make units draggable, add sound upload UI
5. **`src/components/editor/TimelinePanel.tsx`** — Add sound track, clickable/draggable keyframes, delete track button with confirmation, fix effect grouping for standalone effects
6. **`src/domain/services/videoExport.ts`** — Fix export to include effects and render narration text on canvas
7. **`src/pages/Index.tsx`** — Play sound events during playback
8. **`src/components/editor/PropertiesPanel.tsx`** — Keyframe editing UI when a keyframe is selected

## Sound Event Model
```
SoundEvent {
  id: string
  startTime: number (ms)
  duration: number (ms)
  audioUrl: string
  label: string
  volume: number (0-1)
}
```

## Video Export Fix Strategy
- After `computeFrame(time)`, use a promise-based approach: set state, wait for React re-render via `requestAnimationFrame`, then capture.
- For narration text: during export, render narration text imperatively onto the canvas using `ctx.fillText()` after capturing the Konva stage image.
- This ensures narrations (HTML overlays) appear in the export.

