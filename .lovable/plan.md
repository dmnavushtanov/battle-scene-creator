

# Plan: Timeline Scrubbing, Effect Tracks, Smoke Fix, and Visual Improvements

## Changes

### 1. Continuous timeline scrubbing (drag the playhead)
**Problem**: The ruler only responds to `onClick`, not `onMouseDown` + `onMouseMove`. Holding and dragging does nothing.

**Fix** in `TimelinePanel.tsx`: Replace `onClick={handleTimelineClick}` on the ruler with `onMouseDown` that registers `mousemove`/`mouseup` on window. Each move computes `time` from cursor position and calls `seekTo(time)`, giving real-time scrubbing with all units moving live.

### 2. Effects as mini timeline blocks on unit tracks (not dots)
**Problem**: Effects on unit rows are 8px dots with `pointer-events-none`. User wants them as small colored bars (like mini timeline blocks) showing start + duration, directly on the unit row.

**Fix** in `TimelinePanel.tsx`:
- Replace the effect indicator dots with small colored bars rendered on the unit track row itself (height ~4px, positioned at bottom of the 24px row).
- Each bar: `left = eff.startTime * pxPerMs`, `width = Math.max(6, eff.duration * pxPerMs)`, colored by `EFFECT_COLORS[eff.type]`.
- Bars are clickable: clicking one selects the unit, sets `selectedEffectId`, and auto-expands the effect sub-rows.
- Keep the expand/collapse toggle for the full sub-row view (with TimelineBlock for move/resize).

### 3. Clicking effect highlights it on the unit timeline
**Fix**: When clicking an effect bar (either the mini-bar or the expanded TimelineBlock), set `selectedEffectId` in store. The corresponding mini-bar on the unit row gets a brighter outline/ring to show selection. The expanded sub-row block also highlights.

### 4. Fix smoke effect not rendering
**Problem**: `SmokeEffect` filters for `e.type === 'smoke' && !e.ended`. But `derivedEffects` only includes effects that are currently active (between `startTime` and `endTime`). If the smoke effect is not at the current time, it won't render — this is correct. The real issue: the smoke's `progress` ramps from 0→1, but the `PUFFS` have `delay` values up to 0.65. When `p` is small, `localP = (p - delay) / (1 - delay)` is ≤ 0 for most puffs. The smoke only really appears past 50% progress, and with a 2s default duration it's subtle. Additionally the opacity is capped at `intensity * 0.4 = 0.24` — very faint.

**Fix** in `SmokeEffect.tsx`: Increase base opacity from `0.4` to `0.65`, reduce puff delays so smoke appears sooner, increase circle radii for more visible puffs.

### 5. Improve all effects visually
Research-informed improvements:
- **Explosion**: Add secondary flash ring, more particles, smoke trail that lingers
- **Fire**: Add heat distortion haze circle, more varied flame shapes, sparks
- **Gunshot**: Brighter flash, add spark particles radiating from muzzle
- **Blood**: Slightly larger splatters, add droplet trails
- **Crack**: Already improved to shattered glass — minor tweaks to line density

## Files to Change

1. **`src/components/editor/TimelinePanel.tsx`**
   - Ruler: replace `onClick` with `onMouseDown` scrubbing handler
   - Unit tracks: replace dot indicators with mini colored bars (clickable, show duration)
   - Clicking mini-bar: selects unit + sets selectedEffectId + auto-expands sub-rows

2. **`src/components/editor/effects/SmokeEffect.tsx`**
   - Increase opacity multiplier, reduce puff delays, larger radii

3. **`src/components/editor/effects/ExplosionEffect.tsx`**
   - Add secondary shockwave, more debris, lingering smoke

4. **`src/components/editor/effects/FireEffect.tsx`**
   - Add heat haze, more flame layers, sparks

5. **`src/components/editor/effects/GunshotEffect.tsx`**
   - Brighter flash, spark particles

6. **`src/components/editor/effects/BloodEffect.tsx`**
   - Larger splatters, more droplet trails

