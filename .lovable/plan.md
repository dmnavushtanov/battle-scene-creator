

# Plan: Arrow Drawing, Voice Recording, Gunshot Effect, and Video Export Clarification

## 1. Video Export — How It Works (Answer)

The video export captures the **full Konva stage** at 1920x1080 (the fixed canvas size), not the current viewport/zoom. The camera does NOT move — it renders the entire map from origin with no pan/zoom applied. Every frame steps through the timeline and captures the stage at `pixelRatio: 1`.

**No changes needed** unless you want camera keyframes (pan/zoom animation during export) — that would be a separate feature.

## 2. Arrow Drawing Tool — Fix

**Problem**: The toolbar has an "Arrow" tool button, but `MapCanvas` has zero logic for creating arrow drawings. There's no mousedown/mousemove/mouseup handler when `activeTool === 'arrow'`.

**Fix**: Add drawing state and handlers in `MapCanvas.tsx`:
- On mousedown (left button) when `activeTool === 'arrow'`: create a temporary arrow with start point at click position
- On mousemove: update the endpoint
- On mouseup: finalize and add the arrow as a `MapObject` with `type: 'drawing'`, `drawTool: 'arrow'`, and `points: [x1, y1, x2, y2]`
- Track drawing state with a `useRef` for the in-progress arrow

## 3. Voice Recording for Narration

Add a microphone recording button to the Narration editor in `PropertiesPanel.tsx`. Uses the browser's `MediaRecorder` API:
- Record button starts capturing from `navigator.mediaDevices.getUserMedia({ audio: true })`
- Stop button finalizes, creates a `Blob`, converts to data URL, and stores in `narrationEvent.audioUrl`
- Show a playback `<audio>` control when `audioUrl` exists
- During playback, if the narration has an `audioUrl`, play it at the narration's `startTime`

**Files**: `src/components/editor/PropertiesPanel.tsx` (add recording UI to NarrationEditor section)

## 4. New Effect: Gunshot / Musket

Add a new `EffectType` and visual:
- Add `'gunshot'` to `EffectType` union in `models.ts`
- Add preset in `effects.ts`: short duration (300ms), high intensity, non-persistent
- Visual in `MapCanvas.tsx`: muzzle flash (bright yellow-white burst from one side), small smoke puff, optional tracer line extending outward
- Color for timeline: `#ffdd00` (bright yellow)

## Files to Change

1. **`src/domain/models.ts`** — Add `'gunshot'` to `EffectType`
2. **`src/domain/services/effects.ts`** — Add gunshot preset
3. **`src/components/editor/MapCanvas.tsx`** — Arrow drawing handlers + gunshot visual renderer + update `EFFECT_COLORS` and `EFFECT_VISUAL_SYMBOLS`
4. **`src/components/editor/PropertiesPanel.tsx`** — Voice recording UI in narration editor
5. **`src/components/editor/TimelinePanel.tsx`** — Add gunshot to effect color map
6. **`src/pages/Index.tsx`** — Wire narration audio playback during timeline play

