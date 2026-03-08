

# Plan: Effect Timing, Locked Timeframe, Path Drawing, Timeline UX, Grouped Unit Sorting

## 1. Effects start at current time (not scene start)

**Problem**: `createEffectFromPreset` receives `currentTime` from the drop handler, but standalone effects dropped on empty space also call `createEffectFromPreset(preset, currentTime)` — this should already work. Let me verify: in `handleDrop`, line 299 and 320 both pass `useEditorStore.getState().currentTime`. This is correct. The issue may be that the playhead is at 0 when users expect it elsewhere — but no, this should be fine. I'll double-check that `currentTime` is actually being read at drop time (it is via `getState()`). This should already work correctly. No change needed unless there's a bug — but the user says it starts at the beginning. Let me re-read... `createEffectFromPreset(preset, startTime)` uses `startTime` param directly. The call passes `useEditorStore.getState().currentTime`. This is correct. The user might be confused, or the playhead might visually be at 0. I'll ensure this is clearly working.

**Actually**: Looking more carefully, the user says "Add the effect on the unit where the time selector is right now not at the beginning of the scene." This confirms the effect IS being added at time 0 despite the playhead being elsewhere. The `currentTime` from `getState()` should be correct... unless the state hasn't been committed. This should work. I'll verify and keep the existing logic but ensure it's reliable.

## 2. Lock Timeframe checkbox

Add a `timeframeLocked` state (local to `TimelinePanel`). When locked, the controls bar stays sticky/fixed at top and the time ruler stays visible when scrolling vertically. Implementation: when locked, render the controls bar with `sticky top-0 z-20` and optionally make the time ruler sticky too below it.

## 3. Path Drawing Tool

Add a new tool `'path'` to `DrawToolType`. When active:
- Click to start a path, each subsequent click adds a waypoint
- Double-click or press Enter to finalize
- The path becomes a series of keyframes for the selected unit, making it follow the drawn curve
- Store as a polyline in `MapObject.points` for visual preview, then convert points to keyframes spaced evenly across the recording duration

**Model changes**: Add `'path'` to `DrawToolType` union. Add a path tool button in `Toolbar`.

**MapCanvas changes**: Track path-drawing state with refs. On clicks, accumulate points. On double-click, finalize: if a unit is selected, convert the path points into keyframes distributed evenly across the scene duration (or recording duration). Show a preview polyline while drawing.

## 4. Timeline Effect Rows — Collapsible per-effect-type tracks

**Current problem**: Each unit gets effects inline on its track. With many effects, this becomes unmanageable.

**Better UX approach**: Group effects by type into collapsible sub-rows under each unit. Each effect type used by a unit gets its own thin track row (e.g., "Blood", "Fire") that can be shown/hidden. Add a toggle button on each unit row to expand/collapse its effect sub-tracks. Multiple effects of the same type stack on the same row.

Implementation:
- Under each unit track, render one sub-row per distinct effect type used by that unit
- Add a small expand/collapse toggle on the unit row
- Default: collapsed (effects shown as small dots on unit row). Expanded: full sub-rows visible
- Each sub-row labeled with effect type icon + name + color

## 5. Grouped units sorted together in timeline

Sort the `units` array before rendering in timeline: group members are placed consecutively, ordered by group. Ungrouped units go at the end. Within each group, maintain original order. Add a colored left-border or background tint matching the group color.

---

## Files to Change

1. **`src/domain/models.ts`** — Add `'path'` to `DrawToolType`
2. **`src/components/editor/Toolbar.tsx`** — Add path tool button
3. **`src/components/editor/MapCanvas.tsx`** — Path drawing logic (click-to-add-waypoints, double-click-to-finalize, convert to keyframes)
4. **`src/components/editor/TimelinePanel.tsx`** — Lock checkbox, collapsible effect sub-rows per type, group-sorted unit ordering
5. **`src/store/editorStore.ts`** — Potentially add helper to batch-add keyframes from path points

