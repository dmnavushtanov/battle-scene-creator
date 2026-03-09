

# Plan: Unit Time Ranges, Fade In/Out, Clean Icons, Map Library

## 1. Unit Time Range (Lifespan on Timeline)

Add `startTime` and `endTime` fields to `MapObject` so each unit is only visible during its time window — not for the entire scene.

**Model change (`models.ts`):** Add `startTime?: number` and `endTime?: number` to `MapObject`. Default: `startTime = 0`, `endTime = undefined` (meaning full scene duration).

**Timeline rendering (`TimelinePanel.tsx`):** Render each unit track as a resizable block (like narration/overlay blocks) showing its active time range. The block can be dragged to move in time or resized from edges. Keyframe dots render inside this block only.

**Playback logic (`MapCanvas.tsx` + `timeline.ts`):** When rendering units, check `if (currentTime < unit.startTime || currentTime > (unit.endTime ?? sceneDuration))` → skip rendering (return null). This is checked before keyframe interpolation.

**Properties panel (`PropertiesPanel.tsx`):** Add "Visible From" and "Visible Until" time inputs (in seconds) for each unit.

## 2. Fade In / Fade Out

Add `fadeInDuration?: number` and `fadeOutDuration?: number` fields to `MapObject` (in ms, default 0 = no fade).

**Rendering (`MapCanvas.tsx`):** Calculate opacity based on current time relative to `startTime` and `endTime`:
- If within `fadeInDuration` of `startTime`: opacity = `(currentTime - startTime) / fadeInDuration`
- If within `fadeOutDuration` of `endTime`: opacity = `(endTime - currentTime) / fadeOutDuration`
- Otherwise: opacity = 1
- Apply this opacity to the unit's `<Group>` wrapper

**Properties panel:** Add "Fade In" and "Fade Out" duration inputs (seconds) next to the time range controls. Small number inputs with 0.1s step.

**Timeline visual:** Show small gradient indicators at the start/end of the unit block to hint at fade regions.

## 3. Fix "None" Faction Color — Clean Icons

Currently when `factionColor` is undefined (None), the unit still renders with `UNIT_COLOR` as background fill and border (line 769-772 in MapCanvas):
```
const unitColor = unit.factionColor || UNIT_COLOR;
<Rect fill={`${unitColor}44`} stroke={unitColor} strokeWidth={2} .../>
```

**Fix (`MapCanvas.tsx`):** When `factionColor` is explicitly set to `'none'` (or undefined and no faction needed), skip the background `<Rect>` entirely. Just render the icon image directly without any box/border.

**Properties panel:** Change the "None" button to set `factionColor: 'none'` (string) instead of `undefined`. Then in MapCanvas, check `if (unit.factionColor !== 'none')` to conditionally render the box.

## 4. Map Library

Store uploaded map images in a library (similar to custom icons). Users can switch between maps without re-uploading.

**Store (`editorStore.ts`):** Add `mapLibrary: { id: string; label: string; dataUrl: string }[]` state + `addMapToLibrary` / `removeMapFromLibrary` actions.

**Asset Library (`AssetLibrary.tsx`):** Under "Background Map" section:
- When user uploads a map, save it to both `mapLibrary` AND set as background
- Show thumbnails of all uploaded maps in a grid
- Click a map thumbnail → set it as the current scene's background
- Each thumbnail has a delete button to remove from library
- This way users can switch maps easily across scenes

## Files Changed

1. `src/domain/models.ts` — add `startTime`, `endTime`, `fadeInDuration`, `fadeOutDuration` to MapObject
2. `src/store/editorStore.ts` — add `mapLibrary` state + CRUD actions
3. `src/components/editor/MapCanvas.tsx` — time range visibility check, fade opacity, clean icon rendering
4. `src/components/editor/TimelinePanel.tsx` — unit track as resizable time-range block
5. `src/components/editor/PropertiesPanel.tsx` — time range + fade inputs, fix None faction color
6. `src/components/editor/AssetLibrary.tsx` — map library UI with thumbnails
7. `README.md` — document new features

