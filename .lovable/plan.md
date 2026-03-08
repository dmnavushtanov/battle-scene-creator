

# Plan: Timeline Scale, Effects Flow Fix, Click-Away, and UX Polish

## Issues Summary

1. **Click-away deselect broken** — `handleStageClick` checks for bg-rect and grid IDs but grid lines use `listening={false}` so clicks pass through. The real issue: clicking on the Stage background between grid lines hits the Stage itself, but Konva's `e.target` for empty space returns the Stage. Need to verify the condition is actually firing. Likely issue: the `handleStageClick` runs but `setSelectedIds([])` doesn't clear `selectedNarrationId`/`selectedOverlayId`. Also need to clear those on deselect.

2. **Right sidebar collapse button invisible** — The button uses `-translate-x-full` which positions it behind the canvas. Parent has `overflow-hidden` so it's clipped.

3. **Timeline not manually scalable** — Currently `timelineWidth = 800` is hardcoded. Add +/- zoom buttons to the timeline controls bar.

4. **Effects flow is broken** — Clicking an effect in the sidebar should ONLY work via drag-and-drop (remove click handler). Effects on units should appear on the unit's own timeline track, not in a separate combined FX row.

5. **Different effect colors** — Each effect type gets a distinct color in the timeline.

6. **Effects always visible on map** — When an effect is applied to a unit, show a small indicator on the unit at all times (not just during playback).

7. **Review all effect flows** — Ensure drag-drop onto unit works, drag-drop onto empty space creates standalone effect, effects render during playback.

8. **Effects on unit tracks, not FX row** — Move effect blocks back to each unit's timeline row. Remove the combined FX track.

9. **Time controller locked on scroll** — The controls bar is already `sticky top-0` but inside a scrollable container. Need to ensure it works by keeping controls outside the scrollable area.

10. **Record time indicator confusing** — The record duration ghost block shows even when not in record mode, making it look like something is selected. Only show it when actively relevant.

11. **README update**

---

## Changes

### `src/components/editor/MapCanvas.tsx`
- **Click-away fix**: In `handleStageClick`, also clear `selectedNarrationId` and `selectedOverlayId` via store. Ensure the condition catches all empty-space clicks (Stage target or bg-rect).
- **Effect indicator on units**: When a unit has effects in `effectsByObjectId`, show a small effect badge (colored dot or icon) on the unit at all times, not just during playback.

### `src/pages/Index.tsx`
- **Right sidebar collapse button**: Move the collapse button outside the `overflow-hidden` container, or change to `overflow-y-auto` and use a different positioning approach (put button in a wrapper that's not clipped).

### `src/components/editor/TimelinePanel.tsx`
- **Manual timeline zoom**: Replace hardcoded `timelineWidth = 800` with state. Add `+`/`-` buttons in the controls bar to zoom timeline in/out.
- **Effects on unit tracks**: Move effect blocks from the combined FX row into each unit's track row. Remove the separate "💥 FX" combined row.
- **Different effect colors**: Map each effect type to a color: explosion=#ff6600, shake=#ffaa00, crack=#888888, blood=#cc0000, smoke=#888, fire=#ff4400.
- **Time controller sticky**: Keep controls bar outside the scrollable div (it already is via `flex-shrink-0 sticky`; verify the structure works).
- **Record ghost block**: Only show the record-duration preview block when record mode is active or the user is hovering the record button area — or remove it entirely and show just the playhead.
- **Narration/overlay block move**: Already implemented with `makeBlockDragHandler('move', ...)` — verify it works.

### `src/components/editor/AssetLibrary.tsx`
- **Remove click handler for effects**: Remove `onClick={() => handleAddEffectPreset(idx)}`. Keep only drag-and-drop. Update the help text to reflect drag-only.

### `README.md`
- Full update documenting all mechanics.

---

## Effect Color Map (for timeline blocks)

```text
explosion  → #ff6600 (orange)
shake      → #ffaa00 (amber)
crack      → #888888 (gray)
blood      → #cc0000 (dark red)
smoke      → #9e9e9e (silver)
fire       → #ff4400 (red-orange)
```

## File List

1. `src/components/editor/MapCanvas.tsx` — click-away fix, effect badges on units
2. `src/pages/Index.tsx` — right panel collapse button fix
3. `src/components/editor/TimelinePanel.tsx` — zoom controls, effects on unit tracks, effect colors, sticky controls, hide record ghost
4. `src/components/editor/AssetLibrary.tsx` — remove click handler for effects
5. `README.md` — full update

