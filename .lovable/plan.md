

# Plan: Delete Key, Group Recording, and UX Analysis

## 1. Delete Key Shortcut with Confirmation

Add keyboard `Delete` key handler in `MapCanvas.tsx` that deletes selected objects after confirmation dialog. Use the same confirmation pattern already in TimelinePanel.

**Files:** `src/components/editor/MapCanvas.tsx` — add Delete key to the existing `handleKeyDown` handler. Show a confirmation dialog (add a state for pending delete + a simple dialog overlay, or use `window.confirm` to match existing Toolbar behavior).

## 2. Group Recording Fix

**Current state:** When you "Select All" in a group, all members get selected. Dragging already moves them together via `onGroupDragMove`. During recording, `onObjectDragStart` captures snapshots for all selected members, and `onGroupDragMove` captures initial snapshots for non-lead members. So **group recording already works** — all moved members get keyframes when you Stop & Save.

**Problem identified:** In `onGroupDragMove` (line 628-630), it calls `captureInitialSnapshot` on every move event for non-lead members, which is redundant but not harmful. The actual issue is that `finalizeRecording` only creates keyframes for objects in `recordingSession.movedObjectIds` — and the non-lead members are only captured via `captureInitialSnapshot` if they appear in the moved set. Let me verify...

Looking at `onObjectDragStart` (line 587-603): it captures initial snapshot for the dragged unit AND all other selected units. Then `onGroupDragMove` updates positions of non-lead members. But `onObjectDragEnd` only records the lead unit's final position. The non-lead members' final positions are updated in `onGroupDragMove` via `_updateActiveScene`, but `captureInitialSnapshot` in `onGroupDragMove` adds them to `movedObjectIds` in the recording session.

**Conclusion:** Group recording should already work. The key data flow:
1. Drag start → captures initial snapshot for lead + all selected
2. During drag → `onGroupDragMove` moves all members + captures snapshots
3. `finalizeRecording` creates start/end keyframes for all objects in `movedObjectIds`

But the non-lead members only get their END position from `scene.objectsById` (their current position after drag). This should work correctly since `onGroupDragMove` updates their positions in the scene.

**No code change needed for group recording** — it already works. But I should verify by reading `recording.ts`.

Actually, let me check `finalizeRecording` to be sure.

**Files to verify:** `src/domain/services/recording.ts`

## 3. UX Analysis — Simulating User Workflows

### Workflow A: "I want to animate a battle line advancing"
1. Place 5 infantry units in a line ✅
2. Shift-click to select all 5 ✅
3. Create group → "Front Line" ✅
4. Set record duration to 3s ✅
5. Click Record → drag one unit → all move together ✅ (via group drag)
6. Stop & Save → keyframes created for all 5 ✅
7. Play → all 5 animate forward ✅

### Workflow B: "I want one scout unit to follow a path"
1. Select one unit ✅
2. Switch to Path tool ✅
3. Click waypoints → right-click to save ✅
4. Keyframes spread over record duration ✅

### Workflow C: "I want to draw a path for a group"
1. Select group → path tool says "select exactly 1 unit" ✅ (correctly disabled)
2. **UX gap:** No way to make a whole group follow a path. This is a valid limitation — paths for groups would need to compute offsets for each member relative to the group center. **Recommendation:** Keep disabled but show a clear message.

### Workflow D: "I want to delete something"
1. Select unit → press Delete → nothing happens ❌ **Missing feature**
2. Must use toolbar trash icon or right-click → Delete ✅
3. **Fix:** Add Delete key shortcut

### Workflow E: "I want to rearrange timing of multiple keyframes"
1. Shift-click multiple keyframe dots ✅
2. Drag one → all move together ✅
3. **Works well**

### Workflow F: "I want to copy a unit with its animation"
1. Select unit → Ctrl+C → Ctrl+V ✅
2. New unit appears with same keyframes ✅

### Workflow G: "I want to add an explosion effect to a specific unit"
1. Drag explosion from asset library onto unit ✅
2. Or right-click → Add Effect ✅ (only via canvas context menu on empty space though)
3. **Gap:** No way to add effect to a specific unit from the right-click context menu on the unit itself

### Workflow H: "Play/Pause with Space bar"
1. Press Space → nothing happens ❌ **Missing**
2. Must click Play button

## 4. Improvements to Implement Now

Based on the analysis:

| Change | Impact | Effort |
|--------|--------|--------|
| Delete key with confirmation | High — every user expects this | Small |
| Space bar to play/pause | High — standard video editor shortcut | Tiny |
| Group path message improvement | Medium — clearer UX | Tiny |
| README update | Low | Small |

## 5. Implementation Plan

### A. Delete key + Space bar (`MapCanvas.tsx`)
In the existing `handleKeyDown` handler, add:
- `Delete` / `Backspace`: if `selectedIds.length > 0`, show confirmation then delete all selected
- `Space`: toggle play/pause via `setIsPlaying(!isPlaying)`

For confirmation, add a state variable `pendingDeleteConfirm` and render a small dialog overlay in MapCanvas, OR simply use `window.confirm()` to keep it simple and consistent with the existing Toolbar delete.

### B. Update README
Add Delete key, Space bar, group recording workflow description.

---

## Files Changed

1. `src/components/editor/MapCanvas.tsx` — Delete key, Space bar shortcuts, improved group path message
2. `README.md` — updated keyboard shortcuts table, group workflow docs

