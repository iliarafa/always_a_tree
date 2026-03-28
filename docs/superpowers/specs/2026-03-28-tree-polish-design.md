# Tree Polish Design

Polish the tree's shape, leaves, background, and weather effects to create a more organic, atmospheric experience.

## 1. Tree Shape — Balanced Chaos

**File: `useTree.js`**

- Keep symmetric core: two main splits per branch at each depth level
- Vary branch length ratio per side independently: `0.58 + rng() * 0.12` for each side (instead of shared `0.65 + rng() * 0.06`)
- Add slight random angle nudge per split: `(rng() - 0.5) * 0.06` added to each child's angle for organic irregularity
- Add windswept outlier branches: at depths 3–6, ~25% chance of a third branch at a wider angle (`0.35 + rng() * 0.25` offset), using `d - 2` depth and `len * 0.9` length. Random direction (left or right)
- Increase initial trunk length from `110` to `130`
- Increase max depth from `7` to `8`
- Return branch angle alongside each tip position (needed for leaf dangling)

**Seed**: keep `31415` for determinism.

## 2. Leaves

### 2a. Subtle Shape Variation

**File: `Leaf.jsx`**

- Use seeded RNG to generate per-leaf scale factors: `scaleX = 0.85 + r() * 0.30`, `scaleY = 0.90 + r() * 0.20`
- Apply via `transform: scale(scaleX, scaleY)` on the SVG `<g>` element
- Same base teardrop path, just slightly different proportions per leaf

### 2b. Dangling Attachment

**File: `Leaf.jsx` + `useTree.js`**

- `useTree.js`: return `angle` (the branch angle at that segment) alongside each tip's `x, y`
- `Leaf.jsx`: bias vertical offset downward — change from `(r() - 0.5) * 16` to `r() * 18` (always at or below tip)
- Horizontal offset stays: `(r() - 0.5) * 22`
- Add per-leaf rotation derived from tip angle so leaves hang naturally from their branch

### 2c. Sway Animation

**File: `Leaf.module.css`**

- Increase rotation range from ±1–3° to ±3–6° across the 4 sway keyframes
- Add `translateX` drift to each keyframe: ±2px lateral movement
- Keep the 4 distinct keyframe variations, just with wider amplitudes

## 3. Background — Ink Wash Bleed

**File: `Tree.jsx` (`drawTree` function)**

- After clearing canvas, before drawing branches, render 3–5 ink wash stains
- Each stain: radial gradient positioned near canvas edges (corners, sides)
- Placement uses seeded RNG (deterministic across renders)
- Gradient: `rgba(42, 38, 34, 0.03–0.06)` center fading to transparent
- Elliptical shapes: `80–200px` wide, `60–150px` tall, slightly rotated via canvas transform
- Weather modulation: storms get slightly darker washes (~0.06), clear gets lighter (~0.03)
- No color — warm dark tones only, staying within sumi-e aesthetic

## 4. Weather Effects

### 4a. Depth Layers

**File: `Particles.jsx`**

- Split particles into background and foreground layers
- Background layer (existing canvas, behind leaf layer): ~70% of particles. Smaller, sharper, slightly dimmer
- Foreground layer (new canvas on top of leaf layer, `pointer-events: none`): ~30% of particles. Fewer, larger, blurred via `ctx.filter = 'blur(...)'`
- `Tree.jsx` renders two `Particles` instances: `<Particles layer="back" .../>` (behind leaf layer) and `<Particles layer="front" .../>` (on top). The `layer` prop controls particle size, blur, count ratio, and z-ordering

### 4b. Tree Interaction

**File: `Particles.jsx`**

Pass branch segments into the particle system (prop from Tree.jsx).

- **Rain**: drops that hit a branch segment (simple bounding-box check against segment endpoints) create a tiny splash at the collision point, then drip off. Splash = small expanding/fading ellipse
- **Snow**: particles that land near branch tips slow down and "settle" — shrink and fade in place over a few seconds. Gives impression of brief accumulation without permanent state
- **Fog**: wisps that pass near the trunk x-range get their ellipse width modulated (stretched), creating a wrapping effect

### 4c. Ambient Effects

**File: `Tree.jsx` or new `Ambient.jsx`**

- **Storm**: occasional screen flash — overlay goes to `rgba(255, 255, 255, 0.04)` for ~100ms, then fades. Frequency: every 8–15 seconds (randomized)
- **Fog**: slow opacity pulse on the scene wrapper (`0.95–1.0`), cycling over ~6–8 seconds
- **Snow**: occasional sparkle — tiny white dot that fades in/out at random positions, ~every 2–4 seconds. Very subtle

All ambient effects are deliberately understated — mood enhancement, not spectacle.

## Out of Scope

- Supabase/data layer changes
- Input/UI chrome changes
- Landing page
- New weather palette colors
- Sound
