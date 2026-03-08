

## Design Plan: Effects, Narration, and Overlay System

This covers four feature areas. Here's how they fit together architecturally and from a UX perspective.

---

### 1. Unit Effects (Explosions, Damage, Shake, Blood)

**Concept**: Effects are NOT map objects — they're visual modifiers applied to existing units at specific times on the timeline. Think of them as "effect clips" attached to a unit track.

**Data Model** — new types in `models.ts`:

```text
UnitEffect {
  id: string
  type: 'explosion' | 'shake' | 'crack' | 'blood' | 'smoke' | 'fire'
  startTime: number   // ms
  duration: number     // ms (e.g. shake = 500ms, crack = persistent after trigger)
  intensity: number    // 0-1
  persistent: boolean  // true = damage stays visible after effect ends (crack, blood)
}
```

Stored on the Scene: `effectsByObjectId: Record<string, UnitEffect[]>` — each unit can have multiple effects at different times.

**Rendering**: During playback, `computeDerivedTransforms` also evaluates active effects. The canvas renders:
- **Shake**: rapid x/y offset oscillation via `Math.sin` on the unit group
- **Crack**: overlay a crack pattern image (from a built-in sprite sheet) on top of the unit, fading in at trigger time
- **Blood**: red splatter overlay image, persistent after trigger
- **Explosion**: brief particle-like burst (radial orange/red circles) centered on unit, then fades
- **Smoke/Fire**: looping opacity animation on an overlay sprite

**UX**: In the Properties Panel, when a unit is selected, show an "Effects" section with a dropdown to add effects at the current playhead time. Effects appear as colored markers on the unit's timeline track.

### 2. Built-in Effects Library

A predefined set of effect presets accessible from the Asset Library sidebar under a new "Effects" tab. Each preset shows a preview thumbnail and name. Clicking an effect while a unit is selected adds it at the current time. The presets are just pre-configured `UnitEffect` objects — no external assets needed initially, all rendered procedurally via Konva shapes and transforms.

**Preset list** (Phase 1):
- Shake (short vibration)
- Crack (static damage overlay)
- Blood splatter (red overlay, persistent)
- Explosion burst (radial flash + shake combo)
- Smoke (fading gray circles)

### 3. Text & Voice Narration

**Concept**: Narration events are scene-level timeline items — independent of units. They sit on their own tracks in the timeline.

**Data Model**:

```text
NarrationEvent {
  id: string
  type: 'text' | 'voice' | 'text+voice'
  startTime: number
  duration: number
  // Text properties
  text?: string
  position: 'top' | 'bottom' | 'center' | 'custom'
  customX?: number
  customY?: number
  fontSize: number
  fontStyle: 'normal' | 'bold' | 'italic'
  textAnimation: 'fade' | 'typewriter' | 'slide-up' | 'none'
  textColor: string
  bgOpacity: number  // 0 = no background, 0.7 = dark overlay behind text
  // Voice properties
  audioUrl?: string   // uploaded audio file or generated TTS
}
```

Stored on Scene: `narrationEvents: NarrationEvent[]`

**UX for the creator**:
- Timeline shows a dedicated "Narration" track at the top, separate from unit tracks
- Click "+" on the narration track to add a text/voice event at the playhead
- A modal/panel lets you type text, choose position (preset corners/center or drag on canvas), pick animation style
- For voice: upload an MP3/WAV file, or type text for future TTS integration
- Events show as labeled blocks on the narration track, draggable to reposition in time

**Rendering**: Text renders as a Konva `Text` node in a top overlay layer with the chosen animation. Voice plays via an `<audio>` element synced to the playback clock.

### 4. Picture Overlay (General Portrait / Interstitial)

**Concept**: An "overlay event" that dims/blurs the battle map and shows a full-screen or positioned image with optional text. Like a cutaway in a documentary.

**Data Model**:

```text
OverlayEvent {
  id: string
  startTime: number
  duration: number
  imageUrl: string         // uploaded image
  imagePosition: 'center' | 'left' | 'right'  
  imageScale: number
  backgroundEffect: 'blur' | 'dim' | 'blur+dim'
  dimOpacity: number       // 0.5-0.9
  title?: string           // e.g. "General Napoleon"
  subtitle?: string        // e.g. "Commander of the Grande Armée"
  textPosition: 'below-image' | 'beside-image' | 'bottom'
  transition: 'fade' | 'slide' | 'none'
}
```

Stored on Scene: `overlayEvents: OverlayEvent[]`

**Rendering**: During playback, when an overlay is active:
- Apply a CSS blur filter + dark overlay on the Konva stage container
- Render the portrait image and text as an absolutely-positioned HTML overlay on top of the canvas (not inside Konva — HTML gives better text rendering and blur)
- Fade in/out based on transition setting

**UX**: 
- Add overlay from toolbar or timeline via a dedicated "Overlay" track
- Opens a configuration panel: upload image, set text, choose layout
- Preview in real-time on the canvas

---

### Implementation Phases

**Phase 1** (recommended first): Unit Effects system + built-in effect library. This is self-contained and adds immediate visual impact.

**Phase 2**: Text narration on timeline. Voice as upload-only (no TTS yet).

**Phase 3**: Picture overlay system.

### Files to Change

1. `src/domain/models.ts` — Add `UnitEffect`, `NarrationEvent`, `OverlayEvent` types; extend `Scene` with new arrays
2. `src/store/editorStore.ts` — CRUD actions for effects, narration, overlays
3. `src/components/editor/AssetLibrary.tsx` — "Effects" tab with preset library
4. `src/components/editor/PropertiesPanel.tsx` — Effect controls for selected unit
5. `src/components/editor/TimelinePanel.tsx` — Narration + overlay tracks
6. `src/components/editor/MapCanvas.tsx` — Effect rendering during playback
7. `src/pages/Index.tsx` — HTML overlay layer for portraits + narration text
8. `src/domain/services/timeline.ts` — Effect evaluation logic

