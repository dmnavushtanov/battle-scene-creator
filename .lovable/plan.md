

# Gap Analysis: What YouTube Battle Map Creators Need vs What We Have

## Research Sources
Analyzed workflows from: Boone Loves Video (77K+ views "9 Visual Element Ideas"), Kings and Generals style, HistoryMarche, Thomas White tutorials, American Battlefield Trust (Gettysburg animated maps), and general After Effects battle map workflows.

---

## Current Capabilities — What Works

| Feature | Status | Notes |
|---------|--------|-------|
| Unit icons moving across map | Done | Keyframe animation with interpolation |
| Group movement (battle lines) | Done | Select all + drag + record |
| Path drawing for single units | Done | Click waypoints, auto-keyframes |
| Static arrows on map | Done | Arrow drawing tool |
| Explosions, fire, smoke, blood | Done | 7 effect types with timing |
| Background map image | Done | Custom image upload |
| Text narration overlays | Done | Top/bottom/center with animations |
| Image overlays (portraits etc.) | Done | With transitions |
| Sound events | Done | Timed audio triggers |
| Multiple scenes | Done | Scene management |
| Video export (WebM) | Done | Frame-by-frame rendering |
| Unit visibility keyframes | Done | Fade in/out units over time |
| Copy/paste units with animation | Done | Ctrl+C/V |
| Rectangle selection | Done | Marquee select |
| Keyboard shortcuts | Done | Delete, Space, Ctrl+C/V |

---

## Critical Gaps — What YouTubers Need But We Lack

### 1. Animated Arrows (Growing Along Path)
**Every single battle map video uses this.** Kings and Generals, HistoryMarche — arrows that grow/extend from point A to B over time, showing troop advance direction. Our arrows are static drawings. This is the #1 missing feature.

**What's needed:** An arrow object with a start time and end time. During playback the arrow progressively draws itself from origin to destination. Color-coded per faction.

### 2. On-Map Text Labels (City Names, Dates, Annotations)
YouTubers place text directly on the map — city names, battle names, dates, casualty counts. Our narration is an overlay bar, not positioned text on the canvas.

**What's needed:** A text object type that can be placed at any x,y on the canvas, with font size, color, optional background. Can be keyframed for visibility (appear/disappear at specific times).

### 3. Territory/Zone Shading (Colored Areas)
Showing who controls what territory. A semi-transparent colored polygon that can change over time (frontline shifts). Used in nearly every war overview video.

**What's needed (simplified):** A filled polygon drawing tool. User clicks to define vertices, fills with a faction color at some opacity. Can be keyframed to morph or appear/disappear. Even a simple "colored rectangle zone" would cover 70% of use cases.

### 4. Camera Pan/Zoom During Playback
Every professional battle map video has camera movements — zoom into a flank, pan across the battlefield. Our camera is static during playback.

**What's needed:** Camera keyframes: at time T, the viewport should be at position (x,y) with zoom Z. Interpolate between camera keyframes during playback and export.

### 5. Animated Dashed Lines (Supply Routes, Planned Movements)
Dashed lines that animate (marching ants effect) showing supply lines, retreat routes, flanking maneuvers. Different from arrows — these are persistent animated lines.

### 6. Unit Strength/Count Labels
Numbers next to units showing troop strength (e.g., "5,000" under an infantry icon). Can decrease over time to show casualties.

---

## Nice-to-Have Gaps (Lower Priority)

| Feature | Why |
|---------|-----|
| Faction color system | Units should be color-coded by side (blue vs red) — currently all same color |
| Undo/Redo | Every editor needs this; currently destructive mistakes are permanent |
| Easing curves | Keyframe interpolation is linear-only; ease-in/out makes movement natural |
| Grid/snap | Align units in formation |
| Duplicate scene | Copy a scene as starting point for the next phase of battle |

---

## Priority Recommendation

Based on what would make the biggest impact for a YouTuber trying to create a battle video:

1. **Animated arrows** — without this, videos look amateur compared to Kings and Generals
2. **On-map text labels** — city names and dates are essential context
3. **Faction colors** — red vs blue is the most basic visual distinction
4. **Camera keyframes** — zoom/pan makes videos dramatic
5. **Territory zones** — important for war overview videos, less critical for single-battle videos

---

## Can We Achieve "Everything" Now?

**For a single battle scene** (like Waterloo): ~75% covered. Units move, effects play, narration works. Missing animated arrows and on-map text.

**For a war overview** (like Kings and Generals): ~40% covered. Missing territory shading, animated arrows, camera movements, faction colors, and on-map labels.

**Verdict:** The app is a solid unit animation tool but not yet a complete battle map video creator. The top 3 gaps (animated arrows, on-map text, faction colors) would get us to ~90% for single battles.

---

## Proposed Next Steps

Implement the highest-impact features in order:

### Phase 1: Animated Arrows + On-Map Text + Faction Colors
- **Animated arrow object**: new `MapObject` type `'animated_arrow'` with `points[]`, `startTime`, `endTime`, `color`. During playback, progressively reveal the arrow using Konva `Line` with `dash` offset animation.
- **Map text object**: new `MapObject` type `'text'` with `text`, `fontSize`, `color`, `bgColor`. Placed on canvas, keyframeable for position and visibility.
- **Faction color**: Add `factionColor` field to `MapObject`. Render unit border/background tint in that color. Add a color picker in properties panel.

### Phase 2: Camera Keyframes
- Add `cameraKeyframes: {time, x, y, scale}[]` to `Scene`.
- During playback, interpolate camera position and apply to stage.
- Include camera track in video export.

### Phase 3: Territory Zones
- Polygon drawing tool (click vertices, close shape).
- Fill with faction color at adjustable opacity.
- Keyframeable visibility for territory changes over time.

**Files that would change:** `models.ts`, `MapCanvas.tsx`, `editorStore.ts`, `Toolbar.tsx`, `PropertiesPanel.tsx`, `TimelinePanel.tsx`, `constants.ts`, `timeline.ts`, `videoExport.ts`

