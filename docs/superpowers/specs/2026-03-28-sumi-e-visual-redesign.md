# Sumi-e Visual Redesign

Full visual transformation of "Always a Tree" from a dark-themed digital app to a sumi-e (ink painting) aesthetic — ink on warm parchment, hand-painted feel, contemplative and quiet.

## Background & Canvas

### Parchment Base
- Root background color: `#f4f0e8` (warm aged rice paper)
- Subtle paper grain texture applied to root container via CSS noise or a small tiling image — faint enough to feel tactile without distracting
- Full viewport coverage maintained (`100dvh`)

### Sky Wash
No literal sky. A faint ink-wash gradient bleeds from the top of the canvas, varying by weather condition:
- **Clear**: Almost no gradient, just parchment
- **Cloudy/fog**: Soft grey wash creeping down from top
- **Rain/storm**: Darker ink wash bleeding further down the page
- **Snow**: Cool blue-grey tint at the edges

### Ground
Replace the current radial glow with a soft ink bleed at the tree base — like a brush touching wet paper. Fades into parchment. No hard edges.

## Tree Rendering

### Ink Brushstroke Branches
Still canvas-rendered, but each branch segment drawn to simulate ink brushstrokes:
- **Variable width**: Thicker where the brush presses, thinner at the taper — achieved by drawing each segment as a filled shape (two offset curves) rather than a simple `lineTo` with uniform `lineWidth`
- **Variable opacity**: Darker at stroke centers, softer at edges
- **Color**: Near-black warm ink (`#2a2622`), no brown-to-green gradient. Branches get progressively lighter and thinner toward tips — like a brush running dry
- **Imperfection**: Tiny wobble in stroke paths via subtle noise offset so they don't look computed
- **Depth**: 7 levels maintained. Width and opacity decrease with depth to simulate ink running out

### Rendering Technique
Each branch segment rendered as a filled polygon or quadratic curve pair with simulated pressure. The stroke width at any point is a function of depth and position along the segment (thickest at start, tapering to end).

## Leaves

### Ink-Wash Marks
Each leaf is a brush dab on wet paper rather than a crisp SVG silhouette.

### Shape & Rendering
- Base SVG leaf path retained for hit detection, but visually transformed via SVG filters:
  - `feTurbulence` for organic edge distortion (each leaf gets slightly different seed)
  - `feGaussianBlur` for wash/bleed effect
- Each leaf varies in blur amount (0.3–0.8px) and distortion intensity for hand-placed feel

### Color Palettes (Muted/Desaturated)
All palettes shifted to diluted-ink versions of current seasonal colors:
- **Summer**: Pale sage greens, diluted moss
- **Transition (10-20C)**: Faded ochre mixed with muted green
- **Autumn**: Watery rust, faded ochre
- **Winter**: Cool grey, faint blue-ink
- **Snow**: Barely-there washes, almost ghostly
- **Storm**: Deep muted grey-greens
- **Fog**: Warm grey, nearly invisible

Vein colors follow the same principle — darker diluted ink, not bright contrast.

### Opacity
Reduced from current 0.9 to 0.4–0.7 range. Leaves should feel translucent, as if ink is still wet on paper.

### Animation
- **Sway**: Retained but gentler — slower duration (3.5–5.5s base), smaller rotation range (2-3 degrees). Wind responsiveness still applies.
- **Grow/appear**: Replace scale bounce with an ink-bloom effect — opacity fades from 0 to target over 0.6s while blur decreases from 2px to final value. No scale overshoot. Feels like ink spreading through paper fiber.
- **Stagger**: Maintained — new leaves delay sway by 0.5s after bloom.

### Tooltip (Own Leaves)
- Background: parchment-toned (`rgba(244, 240, 232, 0.95)`)
- Border: faint ink line (`1px solid rgba(42, 38, 34, 0.15)`)
- No backdrop blur (glass-morphism doesn't fit the aesthetic)
- Subtle paper-shadow: `box-shadow: 2px 2px 8px rgba(42, 38, 34, 0.08)`
- Text: dark ink `#2a2622`, Georgia italic, 13px
- Same positioning (28px above leaf, centered, max-width 160px)

## Particle Effects

### Rain
- **Count**: Reduced from 80 to 30–40
- **Shape**: Thin tapered vertical ink strokes (not uniform lines)
- **Width**: Variable, 0.5–1.5px
- **Color**: Diluted ink `rgba(60, 55, 50, 0.15)`
- **Behavior**: Slight angle (0.2 radians), speed 6–10 px/frame, loop from top
- **Rendering**: Each drop drawn as a tapered line — thicker at top, thinner at bottom

### Snow
- **Count**: Reduced to ~20
- **Shape**: Small ink dots with soft blur — like dabbing wet brush tip on paper
- **Radius**: 1–3px with 0.5–1px Gaussian blur
- **Color**: Cool diluted ink `rgba(80, 85, 95, 0.12)`
- **Behavior**: Slow drift (0.4–1.0 px/frame), sine-wave horizontal wobble
- **Variation**: Each dot slightly different in size and blur amount

### Fog
- **Count**: ~6 (unchanged)
- **Shape**: Horizontal ink-wash bands — large faint ellipses
- **Size**: 120–300px wide, 30–70px tall
- **Color**: Warm grey ink `rgba(60, 55, 50, 0.04)`
- **Behavior**: Slow horizontal drift (0.15–0.30 px/frame)
- **Feel**: Like broad wet brushstrokes across the page

### Storm
- Rain strokes become longer, darker (`rgba(40, 35, 30, 0.25)`), more angled, and faster
- Occasional broader splash marks at random positions — short-lived ink splats that fade out

## Input & UI Chrome

### Default State (Hidden)
- A small faint enso circle (incomplete brush-circle, ~24px diameter) near the bottom center of the screen, drawn in diluted ink (`rgba(42, 38, 34, 0.3)`)
- Serves as the only hint that input exists
- Tapping it reveals the input field

### Expanded State
- Text field appears with a faint single ink-line underneath
- Font: Georgia italic (unchanged)
- Text color: dark ink `#2a2622`
- Placeholder: very faint ink `rgba(42, 38, 34, 0.2)` — like pencil guidelines
- Caret color: `rgba(42, 38, 34, 0.4)`
- Width: 70%, max-width 260px, centered

### Submit & Dismiss
- Enter/tap submits the thought
- Field fades back to the minimal ink mark
- No visible button

### Status Messages
- Font: 11px Georgia
- Color: diluted ink `rgba(42, 38, 34, 0.25)`
- Letter spacing: 0.06em
- Same messages: "could not reach the tree", "the wind took it"

### Hint Text
- "tap a leaf to read" at top of screen
- Color: `rgba(42, 38, 34, 0.25)`
- Fades after 4 seconds (1.2s ease transition)
- 11px, letter-spacing 0.1em

### Design Principle
All UI chrome should feel like marginalia — notes in the margin of a painting, not the focus.

## Typography

- **Font**: Georgia serif — unchanged, fits the literary contemplative tone
- **Primary text**: Dark warm ink `#2a2622`
- **Secondary/hint text**: Diluted ink `rgba(42, 38, 34, 0.3)`
- **Placeholder text**: Very faint `rgba(42, 38, 34, 0.2)`

## Weather State Transitions

When weather data updates and the condition changes:
- Sky wash, leaf colors, and particle type crossfade over 2–3 seconds
- No abrupt swaps — transitions should feel like ink slowly spreading through water
- Canvas redraws interpolate between old and new background states

## Paper Texture

Applied to the root container. Options (in order of preference):
1. CSS-only: layered `background-image` using radial gradients at low opacity to simulate grain
2. Tiny tiling PNG (~4KB or less) of paper fiber at very low opacity (0.03–0.05)

Must be subtle — visible on close inspection, not distracting at arm's length.

## Scope Notes

- **No dark mode variant**. The ink-on-parchment concept is the identity.
- **Capacitor/iOS haptics**: Unchanged.
- **Supabase data layer**: Unchanged.
- **Leaf data model**: Unchanged (id, thought, session_id, tip_index, created_at).
- **3-day persistence window**: Unchanged.
- **Safe area handling**: Unchanged — input position still respects `safe-area-inset-top`.
