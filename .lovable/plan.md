

# Plan: Main Menu, Rectangle Select, Group Movement, Overlay Transparency, README

## 1. Add Menu to Editor Header

Add a dropdown menu (File menu) in the editor header bar with "New Project" and "Load Project" options. "New Project" resets the store and returns to the start menu. "Load Project" opens a file picker.

**Files:** `src/pages/Index.tsx` — add a menu button in the header (line 74-79) with "New Project" (resets `projectStarted` to false + resets store) and "Load Project" (triggers file input). Use a simple dropdown or the existing Radix DropdownMenu.

## 2. Rectangle Selection (Marquee Select)

When the select tool is active and the user left-click-drags on empty canvas space, draw a selection rectangle. On mouse-up, select all units whose positions fall inside the rectangle.

**Implementation in `MapCanvas.tsx`:**
- Add state: `selectionRect: {x1, y1, x2, y2} | null`
- On `handleStageMouseDown` (button 0, select tool, target is bg): start marquee at pointer coords
- On `handleStageMouseMove`: if marquee active, update x2/y2 and draw a dashed `<Rect>` on the canvas
- On `handleStageMouseUp`: compute which units are inside the rect, call `setSelectedIds(matchingIds)`, clear marquee
- Render the selection rect as a semi-transparent dashed rectangle on a top layer

**Files:** `src/components/editor/MapCanvas.tsx`

## 3. Group Drag — Move Together

Already partially works (shift-select + drag moves all selected). But when a group is selected via "Select All" in context menu, dragging one member should move all group members. This already happens via `onGroupDragMove` for multi-selected units.

The key improvement: when user clicks a single unit that belongs to a group, and the group was previously "Select All"-ed, we want group drag. Current behavior: clicking one unit deselects others. 

**Decision:** Keep current behavior (click selects one, shift-click multi-selects). But add a note in the context menu: "Move Group" option that selects all members so they can be dragged together. This already exists via `selectGroup`. No code change needed beyond ensuring the UX is clear.

Actually, let me re-read the request — "when group is selected they should be moved together." The `selectGroup` action already sets `selectedIds` to all group members. And multi-selected units already move together via `onGroupDragMove`. So this should work already. I'll verify the drag code handles it properly — it does (lines 354-366 in MapCanvas).

No change needed for basic group drag. It works when all group members are selected.

## 4. Path Drawing for Groups — Disable

For groups (multiple selected), disable the path tool. Show a message: "Path tool works with single units only. Select one unit to draw a path." This is already enforced (line 277-279 checks `sids.length !== 1`). Just need to surface a better message.

**Files:** `src/components/editor/MapCanvas.tsx` — update path status text when multiple are selected.

## 5. Overlay Transparency (More Transparent Background)

The overlay's dim opacity is already configurable (0-1), but the min step is 0.1 and the overlay container itself has a fixed z-30 with the dim background. The user wants to be able to see the map behind the overlay more clearly.

**Changes in `OverlayEditor.tsx`:**
- Change dim opacity step to 0.05, and default new overlays to lower opacity (e.g., 0.3 instead of current default)
- Add an "Overlay Opacity" slider that controls the overall overlay container opacity (separate from dim)

**Changes in `NarrationOverlay.tsx`:**
- The overlay container already respects `dimOpacity`. Ensure min value 0 works (fully transparent background). Currently it does — `rgba(0,0,0,0)` = transparent.

Actually the issue might be simpler: the overlay container background is always opaque black at `dimOpacity`. If user sets dimOpacity to 0, the background is transparent. Let me just make the UI clearer and add a slider for easier control. Also lower the step to 0.05.

**Files:** `src/components/editor/properties/OverlayEditor.tsx` — replace number input with a range slider for dimOpacity (0 to 1, step 0.05), add label showing current value.

## 6. Update README

Add all recent changes: start menu, rectangle selection, 18th-century Bulgarian icons, recording UX improvements, path tool clarity, shift-select keyframes, group movement, overlay transparency controls.

**Files:** `README.md`

---

## Files Changed

1. `src/pages/Index.tsx` — add File menu in editor header (New Project / Load Project)
2. `src/components/editor/MapCanvas.tsx` — rectangle marquee selection, path tool group message
3. `src/components/editor/properties/OverlayEditor.tsx` — dim opacity slider
4. `README.md` — update with all recent features

