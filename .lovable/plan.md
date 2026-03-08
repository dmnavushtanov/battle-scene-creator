

## Plan: Fix Dragging, Show Uploaded Icons in Sidebar, Collapsible Left Panel

### Problem 1: Unit dragging broken by Stage dragging conflict

The root cause: Konva `Stage` has `draggable={activeTool === 'select' && !isRecording}` which intercepts all drag events, preventing units from being dragged. When you click a unit and drag, the Stage captures the event first.

**Fix**: Disable `draggable` on the Stage entirely. Instead, implement canvas panning via middle-mouse-button drag or by holding a modifier key, or by adding a dedicated "pan" mode. The simplest approach: pan only when dragging on empty space (background rect) using manual pointer tracking on the Stage's `onMouseDown/Move/Up` events, while leaving units with their own `draggable` prop.

Specifically in `MapCanvas.tsx`:
- Remove `draggable` from `Stage`
- Add manual pan logic: track `isPanning` state, start pan on mousedown on stage/bg-rect (not on units), update `stagePosition` on mousemove, stop on mouseup
- Units keep their existing `draggable` prop and handlers

### Problem 2: Uploaded custom icons not visible in sidebar

Currently, uploading an icon creates a map object but doesn't show the icon in the Asset Library for reuse. 

**Fix**: Add a store array `customIcons: { id, label, dataUrl }[]` to `editorStore`. When a user uploads an icon:
- Save it to `customIcons` 
- Show it in the Asset Library under a "My Icons" section with a thumbnail
- Clicking a saved custom icon adds a new unit with that `customIcon` to the map (same as clicking a built-in unit type)
- This allows reusing the same uploaded icon multiple times

### Problem 3: Left sidebar collapsible

**Fix** in `Index.tsx`:
- Add `leftPanelOpen` state (mirrors right panel pattern)
- Add a side-edge collapse handle on the left side of the canvas, identical style to the right panel handle
- Conditionally render `<AssetLibrary />` based on state

### Files to Change

1. **`src/store/editorStore.ts`** — Add `customIcons` array and `addCustomIcon` action
2. **`src/components/editor/MapCanvas.tsx`** — Remove Stage `draggable`, implement manual pan via mousedown/mousemove/mouseup on empty canvas
3. **`src/components/editor/AssetLibrary.tsx`** — Show "My Icons" section from store, clicking adds unit with that customIcon; upload saves to store + adds to map
4. **`src/pages/Index.tsx`** — Add left panel collapse toggle with side-edge handle

