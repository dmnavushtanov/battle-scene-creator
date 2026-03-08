

# Refactoring Plan: Clean Up, Deduplicate, Extract

## Problems Found

1. **Duplicated constants**: `EFFECT_COLORS` defined in 3 files (MapCanvas, TimelinePanel, AssetLibrary). `UNIT_SYMBOLS`/`UNIT_LABELS` duplicated in MapCanvas and UnitIcon. `formatTime` duplicated in TimelinePanel and PropertiesPanel.
2. **Giant files**: MapCanvas (948 lines) has 6 inline effect renderers as IIFEs (~300 lines of visual code). PropertiesPanel (716 lines) has 4 sub-components jammed in one file. TimelinePanel (712 lines) has `TimelineBlock` defined inline.
3. **NarrationOverlay** (150 lines) lives inside `Index.tsx` instead of its own file.
4. **No shared utility** for common formatting or constants.

## Changes

### 1. New file: `src/domain/constants.ts`
Extract all shared constants:
- `EFFECT_COLORS` (from 3 files)
- `EFFECT_VISUAL_SYMBOLS` (from MapCanvas)
- `UNIT_SYMBOLS`, `UNIT_LABELS`, `UNIT_COLOR` (from MapCanvas)
- `GROUP_COLORS` (from editorStore)

### 2. New file: `src/domain/formatters.ts`
Extract shared formatting:
- `formatTime(ms)` — used in TimelinePanel and PropertiesPanel
- `formatTimeSec(ms)` — the seconds format used in KeyframeEditor

### 3. Extract effect renderers: `src/components/editor/effects/`
Create one file per effect type, each exporting a simple React component:
- `CrackEffect.tsx`
- `BloodEffect.tsx`
- `ExplosionEffect.tsx`
- `SmokeEffect.tsx`
- `FireEffect.tsx`
- `GunshotEffect.tsx`
- `index.ts` — barrel export + `EffectRenderer` component that switches on type

Each receives `{ size, effects, currentTime }` as props. This removes ~300 lines from MapCanvas.

### 4. Extract from PropertiesPanel into `src/components/editor/properties/`
- `KeyframeEditor.tsx`
- `NarrationEditor.tsx`
- `OverlayEditor.tsx`
- `GroupSection.tsx`
- `PropertiesPanel.tsx` — slim orchestrator that imports the above

### 5. Extract `NarrationOverlay.tsx` from `Index.tsx`
Move the `NarrationOverlay` component to `src/components/editor/NarrationOverlay.tsx`. Index.tsx becomes a clean layout-only file.

### 6. Extract `TimelineBlock.tsx` from `TimelinePanel.tsx`
Move the `TimelineBlock` component and `makeBlockDragHandler`/`makeKeyframeDragHandler` helpers to `src/components/editor/timeline/TimelineBlock.tsx` and `src/components/editor/timeline/dragHandlers.ts`.

### 7. Clean up imports in all consumer files
- MapCanvas, TimelinePanel, AssetLibrary, editorStore: import from `constants.ts` and `formatters.ts`
- Remove all local duplicates

### 8. `getShakeOffset` and `seededRandom` in MapCanvas
Move to `src/domain/services/effects.ts` — they are pure functions with no React dependency.

### 9. Update README
Reflect new file structure, recent features (path tool, sound events, gunshot effect, voice recording, keyframe editing, track deletion).

## File Summary

```text
NEW FILES:
  src/domain/constants.ts
  src/domain/formatters.ts
  src/components/editor/effects/CrackEffect.tsx
  src/components/editor/effects/BloodEffect.tsx
  src/components/editor/effects/ExplosionEffect.tsx
  src/components/editor/effects/SmokeEffect.tsx
  src/components/editor/effects/FireEffect.tsx
  src/components/editor/effects/GunshotEffect.tsx
  src/components/editor/effects/index.ts
  src/components/editor/properties/KeyframeEditor.tsx
  src/components/editor/properties/NarrationEditor.tsx
  src/components/editor/properties/OverlayEditor.tsx
  src/components/editor/properties/GroupSection.tsx
  src/components/editor/NarrationOverlay.tsx
  src/components/editor/timeline/TimelineBlock.tsx
  src/components/editor/timeline/dragHandlers.ts

MODIFIED FILES (slimmed down):
  src/components/editor/MapCanvas.tsx         (~948 → ~550)
  src/components/editor/PropertiesPanel.tsx   (~716 → ~200)
  src/components/editor/TimelinePanel.tsx     (~712 → ~500)
  src/pages/Index.tsx                         (~232 → ~80)
  src/store/editorStore.ts                    (import GROUP_COLORS)
  src/components/editor/AssetLibrary.tsx      (import EFFECT_COLORS)
  src/domain/services/effects.ts              (add getShakeOffset, seededRandom)
  README.md                                   (update)
```

No new dependencies. No behavior changes. Pure structural refactoring.

