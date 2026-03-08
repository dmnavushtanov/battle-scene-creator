

## Analysis: Drawing Tools UX Review

### The Problem

The current drawing tools (arrow, line, freehand, rectangle, circle) render as raw Konva shapes — solid colored strokes on top of a carefully designed tactical map. A bright blue freehand scribble or a plain rectangle looks amateurish and breaks the immersive military aesthetic.

### What's Actually Useful on a Battle Map?

From an end-user (military history content creator) perspective:

1. **Arrows** — YES, essential. Movement arrows showing troop advances, retreats, flanking maneuvers. But they need to look tactical: dashed or styled lines, proper arrowheads, maybe with a slight glow or outline so they read on any background.

2. **Lines** — Marginal. A line without an arrowhead is just... a line. It could represent a front line or boundary, but only if styled properly (dashed, thick, with a label). As-is, not useful.

3. **Freehand** — NO. A wobbly mouse-drawn line on a polished map looks terrible. No professional tool uses raw freehand on tactical maps.

4. **Rectangle / Circle** — Marginal. Could represent zones (objectives, kill zones, defensive perimeters), but only if rendered as semi-transparent filled areas with dashed borders — not solid strokes.

### Recommendation

**Keep only arrows. Remove the rest for now.** Arrows are the single most important annotation on any battle map animation. The others either look bad or need significant styling work to be usable.

Later, if needed, add:
- **Zone markers** (styled rectangles/circles with transparency and tactical borders)
- **Front lines** (curved, styled lines with hash marks for fortifications)

But these should be purpose-built components, not generic shape tools.

### Changes

1. **`src/domain/models.ts`** — Keep `DrawToolType` but reduce to `'select' | 'arrow'`
2. **`src/components/editor/Toolbar.tsx`** — Remove line, freehand, rectangle, circle buttons from the toolbar
3. **`src/components/editor/MapCanvas.tsx`** — Remove rendering logic for non-arrow draw tools; style arrows with tactical look (dashed line, proper arrowhead, amber/olive color matching the theme)
4. **Clean up** any dead code paths for removed tools

This keeps the UI clean, the map professional, and leaves room to add properly-designed tactical annotations later.

