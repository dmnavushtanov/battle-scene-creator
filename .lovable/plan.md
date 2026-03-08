

# Plan: Map Menu, Text Selection Fix, Delete Confirmation, Expanded Asset Library with Static Icons, and Copy/Paste

## 1. Fix text selection when dragging timeline/path elements

**Problem**: Dragging the timeline scrubber or path dots causes browser text selection (labels turn blue).

**Fix** in `TimelinePanel.tsx`: Add `user-select: none` (`select-none` Tailwind class) to the entire timeline panel container. Also add `e.preventDefault()` in `handleRulerScrub` and `makeBlockDragHandler` and `makeKeyframeDragHandler` to prevent default browser drag/selection behavior.

**Fix** in `MapCanvas.tsx`: The canvas container already uses Konva which handles this, but the surrounding HTML may allow selection. Add `select-none` to the container div.

**Files**: `TimelinePanel.tsx`, `MapCanvas.tsx`

## 2. Delete confirmation for all destructive actions

**Problem**: Currently only track deletion has a confirmation dialog. Deleting keyframes (right-click), effects, narrations, overlays should also confirm.

**Fix**: Generalize the existing delete confirmation dialog in `TimelinePanel.tsx`. Create a shared `pendingDelete` state `{ type, id, label, onConfirm }`. Wire all delete buttons (narration, overlay, sound, effect, keyframe right-click) to show the dialog first.

**Files**: `TimelinePanel.tsx`

## 3. Add "New Map Object" context menu on canvas

**Problem**: No menu to quickly add things to the map.

**Fix**: Add a right-click context menu on the canvas background (when no unit is clicked) using Radix ContextMenu or a simple custom menu. Options: Add each unit type, add each effect type, upload background. Clicking adds the object at the cursor position.

**Files**: `MapCanvas.tsx`

## 4. Expand asset library with static objects (buildings, props) and collapsible categories

**Problem**: Only 8 military unit types exist. User wants D&D/medieval-style static objects: houses, barrels, haystacks, walls, etc.

**Approach**:
- Add a new `objectCategory` field to `MapObject`: `'unit' | 'structure' | 'prop' | 'terrain'`
- Add 20 static icon entries using emoji/unicode symbols (since we render via Konva text like units):

**Static icons (20)**:
- **Structures**: House (🏠), Castle (🏰), Tower (🗼), Church (⛪), Tavern (🍺), Windmill (🌬️), Bridge (🌉), Gate (🚪)
- **Props**: Barrel (🛢️), Haystack (🌾), Cart (🛒), Chest (📦), Well (⛲), Campfire (🔥), Tent (⛺), Flag (🏴)
- **Terrain**: Tree (🌲), Rock (🪨), Mountain (⛰️), River (🌊)

**UX**: Reorganize AssetLibrary's "Units" tab into collapsible sections using Radix Collapsible:
- **Military Units** (collapsed by default after first use)
- **Structures** (houses, castle, tower, etc.)
- **Props** (barrel, haystack, chest, etc.)
- **Terrain** (tree, rock, mountain, river)
- **My Icons** (custom uploads)

Each section has a header that collapses/expands. Grid layout inside.

**Files**: `AssetLibrary.tsx`, `UnitIcon.tsx` (add static type rendering), `domain/models.ts` (extend UnitType union), `domain/constants.ts` (add symbols/labels)

## 5. Copy/Paste (Ctrl+C / Ctrl+V) for units and effects

**Fix**: Add clipboard state to store: `clipboard: { type: 'unit' | 'effect', data: any } | null`. 

- **Ctrl+C**: If a unit is selected, copy its full `MapObject` + keyframes + effects to clipboard. If an effect is selected (via `selectedEffectId`), copy just that effect.
- **Ctrl+V**: If clipboard has a unit, create a duplicate with new ID at offset position (+20, +20). Copy all keyframes and effects with new IDs. If clipboard has an effect, paste it onto the currently selected unit.

**Files**: `store/editorStore.ts` (add clipboard state + copySelected/paste actions), `MapCanvas.tsx` (add keyboard listener for Ctrl+C/V)

## 6. Canvas right-click "Add" menu

**Fix** in `MapCanvas.tsx`: When right-clicking on empty canvas space (not on a unit), show a context menu with categories matching the asset library. Selecting an item creates it at the click position.

**Files**: `MapCanvas.tsx`

## Files Summary

1. **`src/domain/models.ts`** — Extend `UnitType` to include structure/prop/terrain types
2. **`src/domain/constants.ts`** — Add symbols and labels for all new types
3. **`src/components/editor/UnitIcon.tsx`** — Update `UNIT_TYPES` to include all categories with category grouping
4. **`src/components/editor/AssetLibrary.tsx`** — Collapsible category sections, new static icons
5. **`src/components/editor/TimelinePanel.tsx`** — `select-none` + `preventDefault`, generalized delete confirmation
6. **`src/components/editor/MapCanvas.tsx`** — Right-click "Add" menu on empty canvas, `select-none`, Ctrl+C/V keyboard handler
7. **`src/store/editorStore.ts`** — Add `clipboard` state, `copySelected()`, `pasteClipboard()` actions

