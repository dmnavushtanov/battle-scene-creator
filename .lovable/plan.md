

# Plan: Fix Seeking, Timeline Effects, Properties Layout, and UX

## Issues Found

### Bug 1: Seeking doesn't move units to correct positions
**Root cause**: In `MapCanvas.tsx` line 305, `getObjectTransform` only returns derived transforms when `isPlaying` is true:
```
if (isPlaying && derivedTransforms[id]) return derivedTransforms[id];
```
So when paused and seeking (clicking the timeline ruler), `computeDerivedTransforms` runs and populates the store, but the canvas ignores it. Units stay at their base position.

**Fix**: Remove the `isPlaying` guard. Always use `derivedTransforms` when available.

### Bug 2: Effect dots on unit timeline not visible/interactive
The dots exist (line 557-566) but are `pointer-events-none` and only 8px. They need to be clickable to select the effect in the properties panel.

**Fix**: Make effect dots clickable. On click, select the unit and scroll to the effect in properties. Add a `selectedEffectId` state to the store so clicking an effect dot highlights it in PropertiesPanel.

### Bug 3: Path tool saves keyframes without record button
This is by design — path tool and record are separate workflows. But it is confusing.

**Fix**: No code change needed for path tool. However, dragging a unit while NOT recording should NOT create keyframes. Currently `onObjectDragEnd` calls `onObjectDragMove` which just updates position — recording only captures if `isRecording` is true. This should already be correct. Will verify the path tool only fires from explicit path mode.

### Bug 4: Properties panel layout — effects/keyframes should be above basic properties
Currently: Label → Position → Rotation → Scale → Visibility → Keyframes → Effects → Groups.

**Fix**: Reorder to: Type badge + Label → Effects → Keyframes → Groups → (separator) → Position → Rotation → Scale → Visibility/Lock.

### Bug 5: Clicking timeline ruler should pause playback
`handleTimelineClick` calls `seekTo` but doesn't pause.

**Fix**: Add `setIsPlaying(false)` before `seekTo` in `handleTimelineClick`.

### Bug 5.1: Clicking effect dot should select unit + effect
Effect dots are `pointer-events-none`.

**Fix**: Remove `pointer-events-none`, add onClick that selects the unit and sets a new `selectedEffectId` in the store. In PropertiesPanel, highlight the selected effect.

### Bug 7: Update README

## Files to Change

1. **`src/components/editor/MapCanvas.tsx`** — Remove `isPlaying` guard from `getObjectTransform` (1 line change)
2. **`src/components/editor/TimelinePanel.tsx`** — Pause on ruler click; make effect dots clickable
3. **`src/components/editor/PropertiesPanel.tsx`** — Reorder sections: effects + keyframes first, basic properties last
4. **`src/store/editorStore.ts`** — Add `selectedEffectId` state + setter
5. **`README.md`** — Update with all recent changes

