

# Plan: UX Fixes, Effect Overhaul, Narration/Overlay UX, Grouping, and README Update

This is a large scope covering bug fixes, UX improvements, visual upgrades, and new features. Here's the breakdown.

---

## 1. Bug Fixes

### Click-away deselection (not working)
**Root cause**: `handleStageMouseDown` intercepts left-clicks on empty space to start panning, and `handleStageMouseUp` only clears selection if `!panDidMove`. But the issue is that when the user left-clicks empty space, panning starts — and then `handleStageClick` also fires but `panDidMove` is still false because no movement happened. The problem: the panning logic on left-click empty space conflicts. When clicking empty space without moving, `handleStageMouseUp` calls `setSelectedIds([])` AND `handleStageClick` also calls it — but the real issue is that panning starts on empty space left-click, eating the click. Fix: Only start panning on empty space when middle button. Left-click on empty space should just deselect.

### Right panel clipped
**Root cause**: `PropertiesPanel` uses `px-3` but the parent `div` is `w-64`. The panel's content overflows because `overflow-hidden` is on the parent flex container. Fix: Add `overflow-y-auto` and ensure the panel respects its width with proper scrolling.

### Right panel collapse button misaligned
The button uses `absolute -left-6` which places it outside the panel div. This can clip against the canvas. Fix: Adjust positioning.

## 2. Narration & Overlay: Make Them Actually Usable

**Current problem**: Clicking "+" on narration/overlay tracks creates events but there's NO editor UI — the user has no way to edit the text, upload images, or configure anything. The blocks just sit there doing nothing.

**Fix**: When clicking a narration or overlay block on the timeline, open an inline editor panel (popover or replace the properties panel content) where users can:
- **Narration**: Edit text, position (top/bottom/center), font size, animation style, colors
- **Overlay**: Upload image, set title/subtitle, choose background effect, transition

Add a `selectedNarrationId` and `selectedOverlayId` to the store. When set, the PropertiesPanel shows the narration/overlay editor instead of the unit editor.

## 3. Effect Visual Overhaul

Current effects (crack = simple lines, blood = circles, smoke = circles) look poor. Overhaul:

- **Crack**: Use Konva `Path` with SVG-like path data for realistic jagged fracture patterns with depth shading (darker inner, lighter outer edges)
- **Blood**: Irregular splatter shapes using multiple offset ellipses with varying opacity, plus drip trails using elongated ellipses
- **Smoke**: Use more puffs with varying gray tones, better turbulence via perlin-like noise (multi-frequency sin), proper rising/expanding/fading lifecycle
- **Fire**: Inner bright core (yellow-white), mid flames (orange), outer glow (red), with flickering that looks natural — use overlapping teardrop-shaped flames via `Path`
- **Explosion**: Brighter core flash, proper expanding fireball with color gradient (white→yellow→orange→red), ring shockwave, scattered debris with trails

## 4. Timeline Effect Blocks: Draggable Position

Currently effects can only be resized (left/right handles). Add ability to **move** the entire block by dragging from center (not the resize handles). On mousedown in the center area, track the drag and update `startTime`.

## 5. Persistent Named Groups

- Add `groups: Record<string, UnitGroup>` to Scene where `UnitGroup = { id, name, memberIds[] }`
- Add store actions: `createGroup`, `renameGroup`, `deleteGroup`, `addToGroup`, `removeFromGroup`
- **PropertiesPanel**: When multiple units are selected, show a "Create Group" button with a name input. When a group member is selected, show group info with option to "Select All in Group"
- **Canvas**: When clicking a grouped unit, show a subtle indicator (matching colored outline) on all group members
- **Timeline**: Show group name label on grouped unit tracks
- Effects applied to a group apply to all members

## 6. Drag-and-Drop Effects from Sidebar to Map

- Make effect preset buttons in `AssetLibrary` draggable (using HTML drag API)
- On `MapCanvas`, handle drop events: if an effect preset is dropped on a unit, apply it. If dropped on empty space, create a standalone map effect (a new `MapObject` of type `'effect'` placed at that position)
- For standalone map effects: render them on canvas at their position using the same visual renderers

## 7. README Update

Update README to reflect all new features: effects system, narration, overlays, grouping, drawing tool changes, middle-button pan.

---

## Files to Change

1. **`src/domain/models.ts`** — Add `UnitGroup` interface, add `groups` to `Scene`
2. **`src/store/editorStore.ts`** — Add `selectedNarrationId`, `selectedOverlayId`, group CRUD, fix deselect
3. **`src/components/editor/MapCanvas.tsx`** — Fix click-away (remove left-click pan on empty space), improved effect visuals, drop handler for effects, group highlighting
4. **`src/components/editor/PropertiesPanel.tsx`** — Narration editor, overlay editor (with image upload), group management UI, fix clipping with scroll
5. **`src/components/editor/TimelinePanel.tsx`** — Draggable effect blocks (move), clickable narration/overlay blocks to select them, narration/overlay resize handles
6. **`src/components/editor/AssetLibrary.tsx`** — Make effect presets draggable
7. **`src/pages/Index.tsx`** — Fix right panel width/overflow, fix collapse button alignment
8. **`README.md`** — Full update

