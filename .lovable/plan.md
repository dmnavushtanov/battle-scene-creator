

# Plan: Timeline UX, Path Drawing, Effects, and Keyboard Shortcuts

## Changes

### 1. Effects on units inline (not in sub-timeline)
Remove the collapsible effect sub-rows from unit tracks. Instead, show effect blocks directly on the unit's main row alongside keyframe diamonds. Effects render as small colored blocks on the same 6px-height row. Remove `expandedEffects` state and the `effectsByType` grouping logic from `TimelinePanel.tsx`.

### 2. Hide unused tracks, add "+" menu for adding tracks
Narration, Overlay, and Sound tracks are hidden by default when empty. Add a `+` button in the timeline controls bar that opens a small dropdown to add Narration, Overlay, or Sound tracks (which creates an initial event and reveals the track). Tracks with events remain visible. This keeps the timeline clean.

### 3. Remove effect duration dots
When effects are shown inline on the unit row, show only a small colored dot at the start time — no duration bar. This keeps the row clean and uncluttered.

### 4 & 5 & 6 & 6.1. Rework path drawing UX
**Current problems**: Path tool is activated from toolbar, finalized by double-click, unclear feedback, no cancel.

**New approach**:
- Keep the toolbar Path button AND add "Draw Path" to the right-click context menu on units.
- When path tool is activated via context menu, auto-select that unit.
- **Left-click** adds waypoints (same as now).
- **Right-click** finalizes and saves the path (instead of double-click).
- **Escape** cancels path drawing and clears waypoints.
- Show a clear status bar: "Drawing path for [Unit Name] — Left-click: add point, Right-click: save, Esc: cancel"
- After saving, auto-switch back to Select tool.
- Path drawing only works when exactly 1 unit is selected — show warning if no unit selected.

**Files**: `MapCanvas.tsx` (replace double-click with right-click finalize, add Esc handler, add "Draw Path" to context menu).

### 7. Click away + Esc deselects
- In `handleStageClick`: already deselects when clicking empty space — verify this works.
- Add global `keydown` listener for Escape in `MapCanvas.tsx`: clears selection, cancels path drawing if active.

### 8. Improve crack effect to shattered glass
Rewrite `CrackEffect.tsx` with a shattered glass pattern: radiating lines from a central impact point with triangular shards, white highlight edges to simulate glass refraction, more numerous fine lines.

---

## Files to Change

1. **`src/components/editor/TimelinePanel.tsx`**
   - Remove expandedEffects state and effect sub-rows
   - Show effect dots inline on unit row (colored dot at startTime only)
   - Hide Narration/Overlay/Sound tracks when empty
   - Add "+" dropdown button in controls bar to add tracks

2. **`src/components/editor/MapCanvas.tsx`**
   - Path finalize: right-click instead of double-click
   - Add Escape keydown handler (cancel path, deselect)
   - Add "Draw Path" option to right-click context menu
   - Prevent context menu during path drawing (right-click = save)

3. **`src/components/editor/effects/CrackEffect.tsx`**
   - Rewrite with shattered glass visual (more shards, highlights, triangular pattern)

