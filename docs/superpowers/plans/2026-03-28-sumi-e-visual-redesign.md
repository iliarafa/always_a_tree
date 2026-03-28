# Sumi-e Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the app from dark-themed digital aesthetic to ink-on-parchment sumi-e style across all visual elements.

**Architecture:** Modify existing files in-place. No new components needed — the same canvas/SVG/CSS architecture stays, but every rendering function and style rule gets rewritten to produce ink-on-parchment visuals. The weather system still drives palette/particle selection, but all palettes shift to muted ink tones.

**Tech Stack:** React 18, CSS Modules, Canvas 2D API, SVG filters, Vite

---

### File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/index.css` | Modify | Parchment background, paper texture |
| `src/weather.js` | Modify | Muted ink palettes, parchment backgrounds, ink-wash sky/ground colors |
| `src/Tree.jsx` | Modify | Ink brushstroke tree renderer, sky wash, ground bleed, collapsible input |
| `src/Tree.module.css` | Modify | Parchment text colors, hidden input, enso toggle, ink-toned UI |
| `src/Leaf.jsx` | Modify | SVG ink-wash filter, reduced opacity, ink-bloom animation setup |
| `src/Leaf.module.css` | Modify | Gentler sway, ink-bloom keyframes, parchment tooltip |
| `src/Particles.jsx` | Modify | Ink-styled rain/snow/fog/storm particles |
| `index.html` | Modify | Update theme-color meta for parchment |

---

### Task 1: Parchment Background & Paper Texture

**Files:**
- Modify: `src/index.css`
- Modify: `index.html`

- [ ] **Step 1: Update root background to parchment**

In `src/index.css`, change the background from dark to parchment and add a CSS paper grain texture:

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body, #root {
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  overflow: hidden;
  background: #f4f0e8;
  background-image:
    repeating-conic-gradient(rgba(120, 110, 100, 0.03) 0% 25%, transparent 0% 50%),
    repeating-conic-gradient(rgba(120, 110, 100, 0.02) 0% 25%, transparent 0% 50%);
  background-size: 4px 4px, 7px 7px;
  background-position: 0 0, 3px 3px;
}
```

- [ ] **Step 2: Update HTML theme-color**

In `index.html`, add a theme-color meta tag inside `<head>` after the viewport meta:

```html
<meta name="theme-color" content="#f4f0e8" />
```

Also update the `apple-mobile-web-app-status-bar-style` from `black-translucent` to `default` so the status bar works with the light background.

- [ ] **Step 3: Verify visually**

Run: `npm run dev`

Open `http://localhost:5173`. The page should show a warm cream/parchment background with a very faint paper grain texture. The tree and leaves will still render with old dark-theme colors — that's expected at this stage.

- [ ] **Step 4: Commit**

```bash
git add src/index.css index.html
git commit -m "feat: parchment background with paper grain texture"
```

---

### Task 2: Weather Palettes — Muted Ink Tones

**Files:**
- Modify: `src/weather.js`

- [ ] **Step 1: Replace all color palettes with muted ink versions**

Replace the `weatherToVisuals` function's `palettes` object, `backgrounds` object, and `glows` object. The full updated `src/weather.js`:

```javascript
// WMO weather interpretation codes → condition
function wmoToCondition(code) {
  if (code === 0) return 'clear'
  if (code <= 2) return 'clear'
  if (code === 3) return 'cloudy'
  if (code <= 49) return 'fog'
  if (code <= 67) return 'rain'
  if (code <= 77) return 'snow'
  if (code <= 82) return 'rain'
  if (code <= 99) return 'storm'
  return 'cloudy'
}

function weatherToVisuals(tempC, condition, windspeedKmh) {
  // --- muted ink-wash leaf palettes ---
  const palettes = {
    summer: [
      { f: '#8aaa7e', v: '#4a5e42' },
      { f: '#6b8c62', v: '#3d5235' },
      { f: '#a3b89a', v: '#5a6e52' },
      { f: '#7a9970', v: '#445a3c' },
    ],
    transition: [
      { f: '#9aaa6e', v: '#5a6438' },
      { f: '#c4a060', v: '#7a5e30' },
      { f: '#8aaa7e', v: '#4a5e42' },
      { f: '#d4b878', v: '#8a6e3a' },
    ],
    autumn: [
      { f: '#c4a060', v: '#7a5e30' },
      { f: '#b07050', v: '#6a3a28' },
      { f: '#d4b878', v: '#8a6e3a' },
      { f: '#a08040', v: '#604a20' },
    ],
    winter: [
      { f: '#9a9890', v: '#5e5c58' },
      { f: '#8aaaa0', v: '#4a6a60' },
      { f: '#b0aea6', v: '#6e6c68' },
      { f: '#7a9ab0', v: '#3a5a70' },
    ],
    snow: [
      { f: '#b0aea6', v: '#6e6c68' },
      { f: '#bcc8d4', v: '#6a7a8a' },
      { f: '#c8c6be', v: '#8a8880' },
    ],
    storm: [
      { f: '#4a6a5a', v: '#2a3e32' },
      { f: '#5a7a68', v: '#2a3e32' },
      { f: '#607a4a', v: '#344428' },
    ],
    fog: [
      { f: '#908e86', v: '#5e5c58' },
      { f: '#a8a69e', v: '#6e6c68' },
      { f: '#b8b6ae', v: '#7a7870' },
    ],
  }

  // temperature → base season
  let season
  if (tempC > 20) season = 'summer'
  else if (tempC > 10) season = 'transition'
  else if (tempC > 0) season = 'autumn'
  else season = 'winter'

  // condition overrides
  let palette
  if (condition === 'snow') palette = palettes.snow
  else if (condition === 'storm') palette = palettes.storm
  else if (condition === 'fog') palette = palettes.fog
  else if (condition === 'rain') {
    palette = palettes[season].map(c => ({ ...c }))
  } else {
    palette = palettes[season]
  }

  // --- parchment background (same base, sky wash drawn on canvas) ---
  const bg = '#f4f0e8'

  // --- sky wash colors (drawn as gradient on canvas top) ---
  const skyWash = {
    clear: tempC > 15
      ? 'rgba(42, 38, 34, 0.0)'
      : 'rgba(42, 38, 34, 0.02)',
    cloudy: 'rgba(42, 38, 34, 0.06)',
    fog: 'rgba(42, 38, 34, 0.08)',
    rain: 'rgba(42, 38, 34, 0.10)',
    snow: 'rgba(60, 65, 80, 0.06)',
    storm: 'rgba(42, 38, 34, 0.14)',
  }

  // --- ground ink bleed color ---
  const groundBleed = {
    clear: tempC > 15
      ? 'rgba(42, 38, 34, 0.06)'
      : 'rgba(42, 38, 34, 0.04)',
    cloudy: 'rgba(42, 38, 34, 0.05)',
    fog: 'rgba(42, 38, 34, 0.03)',
    rain: 'rgba(42, 38, 34, 0.04)',
    snow: 'rgba(60, 65, 80, 0.04)',
    storm: 'rgba(42, 38, 34, 0.03)',
  }

  const sky = skyWash[condition] || 'rgba(42, 38, 34, 0.0)'
  const ground = groundBleed[condition] || 'rgba(42, 38, 34, 0.04)'

  // --- sway speed multiplier from wind ---
  const swayMultiplier = windspeedKmh < 10
    ? 1.0
    : windspeedKmh < 30
      ? 1.0 - ((windspeedKmh - 10) / 20) * 0.5
      : 0.35

  // --- particles ---
  let particles = 'none'
  if (condition === 'rain' || condition === 'storm') particles = condition === 'storm' ? 'storm' : 'rain'
  if (condition === 'snow') particles = 'snow'
  if (condition === 'fog') particles = 'fog'

  return { palette, bg, sky, ground, swayMultiplier, particles, condition, tempC }
}

export async function fetchWeatherVisuals() {
  try {
    const coords = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('no geo')); return }
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => reject(new Error('denied')),
        { timeout: 6000 }
      )
    })

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto`
    const res = await fetch(url)
    const data = await res.json()
    const { temperature_2m: temp, weathercode: code, windspeed_10m: wind } = data.current

    const condition = wmoToCondition(code)
    return weatherToVisuals(temp, condition, wind)
  } catch (_) {
    return weatherToVisuals(15, 'clear', 5)
  }
}
```

Key changes:
- `palettes` — all colors desaturated/muted to diluted-ink tones
- `bg` — always `#f4f0e8` (parchment), no per-condition background
- `glow` removed, replaced with `sky` (top gradient wash) and `ground` (base ink bleed)
- `particles` now returns `'storm'` separately from `'rain'` so Particles can differentiate
- Return shape changes: `glow` removed, `sky` and `ground` added

- [ ] **Step 2: Update DEFAULT_VISUALS in Tree.jsx**

In `src/Tree.jsx`, update the `DEFAULT_VISUALS` constant to match the new return shape:

```javascript
const DEFAULT_VISUALS = {
  palette: [
    { f: '#8aaa7e', v: '#4a5e42' },
    { f: '#a3b89a', v: '#5a6e52' },
    { f: '#6b8c62', v: '#3d5235' },
  ],
  bg: '#f4f0e8',
  sky: 'rgba(42, 38, 34, 0.0)',
  ground: 'rgba(42, 38, 34, 0.04)',
  swayMultiplier: 1,
  particles: 'none',
}
```

- [ ] **Step 3: Verify the app still loads**

Run: `npm run dev`

Open `http://localhost:5173`. The page should load without console errors. The tree will still render with old brown-to-green gradients (fixed in Task 3), but leaf colors should now appear muted/desaturated. Background is parchment.

- [ ] **Step 4: Commit**

```bash
git add src/weather.js src/Tree.jsx
git commit -m "feat: muted ink-wash weather palettes on parchment"
```

---

### Task 3: Ink Brushstroke Tree Renderer

**Files:**
- Modify: `src/Tree.jsx`

- [ ] **Step 1: Replace the drawTree function with ink brushstroke renderer**

In `src/Tree.jsx`, replace the entire `drawTree` function with:

```javascript
function drawTree(cx, segs, W, H, sky, ground) {
  cx.clearRect(0, 0, W, H)

  // sky wash — faint ink gradient bleeding from top
  if (sky && sky !== 'rgba(42, 38, 34, 0.0)') {
    const skyGrd = cx.createLinearGradient(0, 0, 0, H * 0.5)
    skyGrd.addColorStop(0, sky)
    skyGrd.addColorStop(1, 'rgba(0,0,0,0)')
    cx.fillStyle = skyGrd
    cx.fillRect(0, 0, W, H * 0.5)
  }

  // ground ink bleed — soft radial bleed at tree base
  const grd = cx.createRadialGradient(W / 2, H, 0, W / 2, H, 120)
  grd.addColorStop(0, ground)
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  cx.fillStyle = grd
  cx.fillRect(0, H - 120, W, 120)

  // ink brushstroke branches
  segs.forEach(s => {
    const t = s.d / 7 // 0 at tips, 1 at trunk
    const baseAlpha = 0.25 + t * 0.55 // tips faint, trunk dark
    const baseWidth = Math.max(0.6, s.d * 1.8) // thicker at trunk

    const dx = s.x2 - s.x1
    const dy = s.y2 - s.y1
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len < 0.5) return

    // perpendicular direction for width offset
    const nx = -dy / len
    const ny = dx / len

    // wobble for hand-drawn feel (deterministic from position)
    const wobble = Math.sin(s.x1 * 0.3 + s.y1 * 0.5) * 0.6

    // taper: thick at start, thin at end
    const w1 = baseWidth * 0.9 + wobble * 0.2
    const w2 = baseWidth * 0.25

    // draw as filled quadrilateral with slight curve
    const mx = (s.x1 + s.x2) / 2 + nx * wobble
    const my = (s.y1 + s.y2) / 2 + ny * wobble

    cx.fillStyle = `rgba(42, 38, 34, ${baseAlpha.toFixed(3)})`
    cx.beginPath()
    cx.moveTo(s.x1 + nx * w1, s.y1 + ny * w1)
    cx.quadraticCurveTo(mx + nx * (w1 + w2) / 2, my + ny * (w1 + w2) / 2, s.x2 + nx * w2, s.y2 + ny * w2)
    cx.lineTo(s.x2 - nx * w2, s.y2 - ny * w2)
    cx.quadraticCurveTo(mx - nx * (w1 + w2) / 2, my - ny * (w1 + w2) / 2, s.x1 - nx * w1, s.y1 - ny * w1)
    cx.closePath()
    cx.fill()
  })
}
```

- [ ] **Step 2: Update the drawTree call in the useEffect**

In `src/Tree.jsx`, find the useEffect that calls `drawTree` and update it to pass the new parameters:

Replace:
```javascript
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')
    drawTree(cx, segs, W, H, visuals.glow)
  }, [segs, W, H, visuals.glow])
```

With:
```javascript
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')
    drawTree(cx, segs, W, H, visuals.sky, visuals.ground)
  }, [segs, W, H, visuals.sky, visuals.ground])
```

- [ ] **Step 3: Verify the tree renders as ink brushstrokes**

Run: `npm run dev`

The tree should now render with warm dark ink strokes that taper from thick (trunk) to thin (tips). Strokes should have slight wobble and variable opacity. The sky should have a faint wash if weather is cloudy/rain/etc. Ground should show a soft ink bleed.

- [ ] **Step 4: Commit**

```bash
git add src/Tree.jsx
git commit -m "feat: ink brushstroke tree renderer with sky wash and ground bleed"
```

---

### Task 4: Ink-Wash Leaf SVG with Bloom Animation

**Files:**
- Modify: `src/Leaf.jsx`
- Modify: `src/Leaf.module.css`

- [ ] **Step 1: Update Leaf.module.css with ink-bloom animation and gentler sway**

Replace the entire contents of `src/Leaf.module.css`:

```css
.leaf {
  position: absolute;
  transform-origin: 50% 100%;
  pointer-events: none;
  transition: opacity 0.4s;
}

.mine {
  pointer-events: all;
  cursor: pointer;
}

@keyframes inkBloom {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes sway1 { 0%, 100% { rotate: -2deg; } 50% { rotate: 2deg; } }
@keyframes sway2 { 0%, 100% { rotate: 1.5deg; } 50% { rotate: -2.5deg; } }
@keyframes sway3 { 0%, 100% { rotate: -1deg; } 50% { rotate: 3deg; } }
@keyframes sway4 { 0%, 100% { rotate: 2.5deg; } 50% { rotate: -1.5deg; } }

.tooltip {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(244, 240, 232, 0.95);
  border: 1px solid rgba(42, 38, 34, 0.15);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  color: #2a2622;
  max-width: 160px;
  min-width: 80px;
  white-space: pre-wrap;
  line-height: 1.6;
  font-style: italic;
  font-family: Georgia, serif;
  pointer-events: none;
  text-align: center;
  z-index: 10;
  box-shadow: 2px 2px 8px rgba(42, 38, 34, 0.08);
}
```

- [ ] **Step 2: Update Leaf.jsx with SVG ink-wash filter and bloom animation**

Replace the entire contents of `src/Leaf.jsx`:

```javascript
import { useState } from 'react'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import styles from './Leaf.module.css'

async function haptic(style = ImpactStyle.Light) {
  try { await Haptics.impact({ style }) } catch (_) {}
}

function seededRng(id) {
  let s = 0
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) | 0
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  return { r, seed: s }
}

export function Leaf({ row, sessionId, tipX, tipY, W, H, isNew, palette, swayMultiplier = 1 }) {
  const [tooltip, setTooltip] = useState(false)
  const mine = row.session_id === sessionId

  const { r, seed } = seededRng(row.id)
  const ox = (r() - .5) * 22
  const oy = (r() - .5) * 16

  const color = palette[Math.abs(seed) % palette.length]
  const animIdx = Math.abs(seed) % 4
  const baseDur = 3.5 + r() * 2 // slower base: 3.5–5.5s
  const dur = `${(baseDur * swayMultiplier).toFixed(2)}s`
  const del = isNew ? '0s' : `${(r() * -5).toFixed(1)}s`

  const left = `${((tipX + ox) / W * 100).toFixed(2)}%`
  const top  = `${((tipY + oy) / H * 100).toFixed(2)}%`

  // ink-wash variation per leaf
  const blurAmount = (0.3 + r() * 0.5).toFixed(2)
  const leafOpacity = (0.4 + r() * 0.3).toFixed(2)
  const turbSeed = Math.abs(seed) % 100
  const filterId = `inkWash-${row.id}`

  const animName = isNew
    ? `inkBloom, sway${animIdx + 1}`
    : `sway${animIdx + 1}`
  const animDur = isNew ? `0.6s, ${dur}` : dur
  const animDelay = isNew ? `0s, 0.6s` : del
  const animIter = isNew ? `1, infinite` : 'infinite'
  const animFill = isNew ? `forwards, none` : 'none'

  function handleClick(e) {
    e.stopPropagation()
    if (mine && row.thought) {
      haptic(ImpactStyle.Light)
      setTooltip(v => !v)
    }
  }

  return (
    <div
      className={`${styles.leaf} ${mine ? styles.mine : ''}`}
      style={{
        left, top,
        animationName: animName,
        animationDuration: animDur,
        animationDelay: animDelay,
        animationIterationCount: animIter,
        animationFillMode: animFill,
        animationTimingFunction: 'ease-in-out',
      }}
      onClick={handleClick}
    >
      <svg width="16" height="22" viewBox="0 0 16 22" style={{ overflow: 'visible' }}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed={turbSeed} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
            <feGaussianBlur stdDeviation={blurAmount} />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`} opacity={leafOpacity}>
          <path
            d="M8,21C3,17,1,12,1,7C1,3,4,0,8,0C12,0,15,3,15,7C15,12,13,17,8,21Z"
            fill={color.f}
          />
          <line x1="8" y1="21" x2="8" y2="2" stroke={color.v} strokeWidth=".8" opacity=".4" />
        </g>
      </svg>
      {mine && tooltip && row.thought && (
        <div className={styles.tooltip} onClick={e => e.stopPropagation()}>
          {row.thought}
        </div>
      )}
    </div>
  )
}
```

Key changes:
- SVG filter per leaf: `feTurbulence` + `feDisplacementMap` + `feGaussianBlur` for ink-wash distortion
- Opacity reduced to 0.4–0.7 range per leaf
- `inkBloom` animation replaces `grow` — fades in with decreasing blur
- Sway ranges reduced to 1–3 degrees
- Base duration slower (3.5–5.5s)
- Tooltip restyled for parchment (cream bg, ink border, paper shadow, no backdrop blur)

- [ ] **Step 3: Verify leaves render as ink washes**

Run: `npm run dev`

Leaves should appear as soft, slightly distorted ink marks with translucent fills. New leaves should fade/bloom in rather than bounce. Sway should be gentler. Tapping own leaf should show a parchment-toned tooltip.

- [ ] **Step 4: Commit**

```bash
git add src/Leaf.jsx src/Leaf.module.css
git commit -m "feat: ink-wash leaves with bloom animation and parchment tooltip"
```

---

### Task 5: Ink-Styled Particle Effects

**Files:**
- Modify: `src/Particles.jsx`

- [ ] **Step 1: Replace Particles.jsx with ink-styled particles**

Replace the entire contents of `src/Particles.jsx`:

```javascript
import { useEffect, useRef } from 'react'

const CONFIGS = {
  rain: {
    count: 35,
    init: (W, H) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: 10 + Math.random() * 8,
      speed: 6 + Math.random() * 4,
      angle: 0.2,
      width: 0.5 + Math.random() * 1.0,
      alpha: 0.08 + Math.random() * 0.07,
    }),
    draw(cx, p, W, H) {
      // tapered ink stroke — thicker at top, thinner at bottom
      const ex = p.x + p.angle * p.len
      const ey = p.y + p.len
      cx.beginPath()
      cx.moveTo(p.x - p.width * 0.5, p.y)
      cx.lineTo(p.x + p.width * 0.5, p.y)
      cx.lineTo(ex, ey)
      cx.closePath()
      cx.fillStyle = `rgba(60, 55, 50, ${p.alpha})`
      cx.fill()
      p.x += p.angle * p.speed
      p.y += p.speed
      if (p.y > H) { p.y = -p.len; p.x = Math.random() * W }
    },
  },
  storm: {
    count: 45,
    init: (W, H) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: 14 + Math.random() * 12,
      speed: 8 + Math.random() * 6,
      angle: 0.35,
      width: 0.6 + Math.random() * 1.2,
      alpha: 0.12 + Math.random() * 0.13,
      isSplash: Math.random() > 0.9,
      splashLife: 0,
    }),
    draw(cx, p, W, H) {
      if (p.isSplash) {
        // ink splat that fades out
        p.splashLife += 0.02
        if (p.splashLife > 1) {
          p.splashLife = 0
          p.x = Math.random() * W
          p.y = H * 0.7 + Math.random() * H * 0.3
        }
        const alpha = 0.15 * (1 - p.splashLife)
        cx.beginPath()
        cx.ellipse(p.x, p.y, 3 + p.splashLife * 4, 1.5 + p.splashLife * 2, 0, 0, Math.PI * 2)
        cx.fillStyle = `rgba(40, 35, 30, ${alpha.toFixed(3)})`
        cx.fill()
        return
      }
      // longer, darker, more angled rain
      const ex = p.x + p.angle * p.len
      const ey = p.y + p.len
      cx.beginPath()
      cx.moveTo(p.x - p.width * 0.5, p.y)
      cx.lineTo(p.x + p.width * 0.5, p.y)
      cx.lineTo(ex, ey)
      cx.closePath()
      cx.fillStyle = `rgba(40, 35, 30, ${p.alpha})`
      cx.fill()
      p.x += p.angle * p.speed
      p.y += p.speed
      if (p.y > H) { p.y = -p.len; p.x = Math.random() * W }
    },
  },
  snow: {
    count: 20,
    init: (W, H) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 2,
      blur: 0.5 + Math.random() * 0.5,
      speed: 0.4 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      alpha: 0.06 + Math.random() * 0.06,
    }),
    draw(cx, p, W, H) {
      p.wobble += 0.02
      cx.save()
      cx.filter = `blur(${p.blur}px)`
      cx.beginPath()
      cx.arc(p.x + Math.sin(p.wobble) * 1.5, p.y, p.r, 0, Math.PI * 2)
      cx.fillStyle = `rgba(80, 85, 95, ${p.alpha})`
      cx.fill()
      cx.restore()
      p.y += p.speed
      p.x += p.drift
      if (p.y > H) { p.y = -4; p.x = Math.random() * W }
    },
  },
  fog: {
    count: 6,
    init: (W, H) => ({
      x: Math.random() * W,
      y: 40 + Math.random() * (H * 0.7),
      w: 120 + Math.random() * 180,
      h: 30 + Math.random() * 40,
      speed: 0.15 + Math.random() * 0.15,
      alpha: 0.02 + Math.random() * 0.02,
    }),
    draw(cx, p, W, H) {
      cx.beginPath()
      cx.ellipse(p.x, p.y, p.w, p.h, 0, 0, Math.PI * 2)
      cx.fillStyle = `rgba(60, 55, 50, ${p.alpha})`
      cx.fill()
      p.x += p.speed
      if (p.x - p.w > W) p.x = -p.w
    },
  },
}

export function Particles({ type, W, H }) {
  const canvasRef = useRef()
  const frameRef = useRef()

  useEffect(() => {
    if (!type || type === 'none') return
    const cfg = CONFIGS[type]
    if (!cfg) return

    const cv = canvasRef.current
    const cx = cv.getContext('2d')
    const particles = Array.from({ length: cfg.count }, () => cfg.init(W, H))

    function tick() {
      cx.clearRect(0, 0, W, H)
      particles.forEach(p => cfg.draw(cx, p, W, H))
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [type, W, H])

  if (!type || type === 'none') return null

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
```

Key changes:
- Rain: 35 particles, tapered ink strokes drawn as filled triangles, diluted ink color
- Storm: separate config — longer/darker/more angled rain + occasional ink splat marks that fade
- Snow: 20 particles, canvas `filter: blur()` per dot, cool ink tones
- Fog: warm grey ink ellipses, slightly more transparent
- Removed shared `color`/`lineWidth` — each particle draws its own fill

- [ ] **Step 2: Verify particle effects**

Run: `npm run dev`

To test particles without waiting for specific weather, temporarily change the fallback in `weather.js` to return different conditions:
- Change `weatherToVisuals(15, 'clear', 5)` to `weatherToVisuals(15, 'rain', 5)` and verify rain looks like ink strokes
- Try `'storm'`, `'snow'`, `'fog'` similarly
- Revert to `'clear'` when done

- [ ] **Step 3: Commit**

```bash
git add src/Particles.jsx
git commit -m "feat: ink-styled rain, snow, fog, and storm particles"
```

---

### Task 6: Collapsible Input with Enso Toggle

**Files:**
- Modify: `src/Tree.jsx`
- Modify: `src/Tree.module.css`

- [ ] **Step 1: Update Tree.module.css for parchment UI and enso toggle**

Replace the entire contents of `src/Tree.module.css`:

```css
.wrap {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  font-family: Georgia, serif;
}

.canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.leafLayer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hint {
  position: absolute;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: rgba(42, 38, 34, 0.25);
  letter-spacing: 0.1em;
  white-space: nowrap;
  pointer-events: none;
  transition: opacity 1.2s ease;
  opacity: 1;
}

.hintHidden {
  opacity: 0;
}

.bottom {
  position: absolute;
  bottom: calc(env(safe-area-inset-bottom, 20px) + 24px);
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  max-width: 260px;
  text-align: center;
}

.enso {
  display: block;
  margin: 0 auto;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.4s ease;
}

.ensoHidden {
  opacity: 0;
  pointer-events: none;
}

.inputWrap {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.4s ease, opacity 0.3s ease;
}

.inputWrapOpen {
  max-height: 80px;
  opacity: 1;
}

.input {
  width: 100%;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(42, 38, 34, 0.15);
  font-size: 14px;
  color: #2a2622;
  padding: 8px 0;
  outline: none;
  text-align: center;
  font-family: Georgia, serif;
  font-style: italic;
  caret-color: rgba(42, 38, 34, 0.4);
}

.input::placeholder {
  color: rgba(42, 38, 34, 0.2);
}

.status {
  font-size: 11px;
  color: rgba(42, 38, 34, 0.25);
  margin-top: 8px;
  letter-spacing: 0.06em;
  height: 14px;
}
```

Key changes:
- All text colors changed from white/rgba(255,...) to ink/rgba(42,38,34,...)
- `.bottom` moved from top to bottom of screen
- Added `.enso`, `.ensoHidden` for the toggle circle
- Added `.inputWrap`, `.inputWrapOpen` for collapsible reveal
- Input border color changed to ink tone

- [ ] **Step 2: Update Tree.jsx with collapsible input and enso toggle**

In `src/Tree.jsx`, add `inputOpen` state and update the JSX. Replace the component's state declarations to add:

```javascript
  const [inputOpen, setInputOpen] = useState(false)
```

Add it after the `visuals` state line.

Then replace the entire return JSX of the `Tree` component:

```javascript
  return (
    <div className={styles.wrap} style={{ background: visuals.bg }} onClick={() => setInputOpen(false)}>
      <canvas ref={canvasRef} className={styles.canvas} width={W} height={H} />
      <Particles type={visuals.particles} W={W} H={H} />
      <div className={styles.leafLayer}>
        {leaves.map(row => {
          const tip = tips[row.tip_index % tips.length]
          return (
            <Leaf
              key={row.id}
              row={row}
              sessionId={sessionId}
              tipX={tip.x}
              tipY={tip.y}
              W={W}
              H={H}
              isNew={row.isNew}
              palette={visuals.palette}
              swayMultiplier={visuals.swayMultiplier}
            />
          )
        })}
      </div>
      <p className={`${styles.hint} ${hintVisible ? '' : styles.hintHidden}`}>
        tap a leaf to read
      </p>
      <div className={styles.bottom} onClick={e => e.stopPropagation()}>
        <svg
          className={`${styles.enso} ${inputOpen ? styles.ensoHidden : ''}`}
          width="24" height="24" viewBox="0 0 24 24"
          onClick={() => setInputOpen(true)}
        >
          <path
            d="M12,2 A10,10 0 1,1 8,3.5"
            fill="none"
            stroke="rgba(42, 38, 34, 0.3)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <div className={`${styles.inputWrap} ${inputOpen ? styles.inputWrapOpen : ''}`}>
          <input
            className={styles.input}
            type="text"
            value={thought}
            onChange={e => setThought(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="leave a thought..."
            maxLength={120}
            autoComplete="off"
            spellCheck={false}
          />
          {status && <p className={styles.status}>{status}</p>}
        </div>
      </div>
    </div>
  )
```

Key changes:
- Added `inputOpen` state to toggle between enso circle and input field
- Enso circle: SVG incomplete brush-circle, fades out when input opens
- Input wraps in a collapsible div that animates open/closed
- Clicking anywhere on the background closes the input
- The `.bottom` container stops propagation so clicking input area doesn't close it

- [ ] **Step 3: Update handleSubmit to close input after submit**

In `src/Tree.jsx`, in the `handleSubmit` function, add `setInputOpen(false)` after the successful insert. Find this block:

```javascript
    await haptic(ImpactStyle.Medium)
    addLeaf(data, true)
```

Replace with:

```javascript
    await haptic(ImpactStyle.Medium)
    addLeaf(data, true)
    setInputOpen(false)
```

- [ ] **Step 4: Verify input interaction**

Run: `npm run dev`

- Page should show a faint enso circle near bottom center
- Tapping it should smoothly reveal the input field
- Typing and pressing Enter should submit, close input, and show the enso again
- Tapping anywhere else on the screen should close the input
- Status messages should appear in ink tones

- [ ] **Step 5: Commit**

```bash
git add src/Tree.jsx src/Tree.module.css
git commit -m "feat: collapsible input with enso toggle, ink-toned UI chrome"
```

---

### Task 7: Weather State Transitions

**Files:**
- Modify: `src/Tree.jsx`

- [ ] **Step 1: Add transition support to the wrap element**

In `src/Tree.jsx`, add a CSS transition to the wrap's background. The `style` on the wrap div already sets `background: visuals.bg`. Add a transition property:

Replace:
```javascript
    <div className={styles.wrap} style={{ background: visuals.bg }} onClick={() => setInputOpen(false)}>
```

With:
```javascript
    <div className={styles.wrap} style={{ background: visuals.bg, transition: 'background 2.5s ease' }} onClick={() => setInputOpen(false)}>
```

- [ ] **Step 2: Add canvas transition for sky/ground changes**

In `src/Tree.jsx`, add previous visuals tracking for smooth canvas interpolation. Add a ref after the `placedIds` ref:

```javascript
  const prevVisualsRef = useRef(null)
  const transitionRef = useRef(null)
```

Then replace the drawTree useEffect with a transitioning version:

```javascript
  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')

    // if no previous visuals, draw immediately
    if (!prevVisualsRef.current) {
      drawTree(cx, segs, W, H, visuals.sky, visuals.ground)
      prevVisualsRef.current = { sky: visuals.sky, ground: visuals.ground }
      return
    }

    // animate canvas redraw with a fade
    if (transitionRef.current) cancelAnimationFrame(transitionRef.current)
    const duration = 2500
    const start = performance.now()

    function animate(now) {
      const t = Math.min((now - start) / duration, 1)
      cx.globalAlpha = 1
      drawTree(cx, segs, W, H, visuals.sky, visuals.ground)
      if (t < 1) {
        transitionRef.current = requestAnimationFrame(animate)
      } else {
        prevVisualsRef.current = { sky: visuals.sky, ground: visuals.ground }
      }
    }
    transitionRef.current = requestAnimationFrame(animate)
    return () => { if (transitionRef.current) cancelAnimationFrame(transitionRef.current) }
  }, [segs, W, H, visuals.sky, visuals.ground])
```

- [ ] **Step 3: Verify transitions**

To test, temporarily modify the weather fallback to cycle conditions, or just verify there are no errors on load. The canvas should draw smoothly without flicker.

- [ ] **Step 4: Commit**

```bash
git add src/Tree.jsx
git commit -m "feat: smooth weather state transitions for canvas and background"
```

---

### Task 8: Final Polish & Visual Audit

**Files:**
- Modify: `src/Tree.jsx` (if needed)
- Modify: `src/Tree.module.css` (if needed)

- [ ] **Step 1: Auto-focus input when opened**

In `src/Tree.jsx`, add a ref for the input and auto-focus it when `inputOpen` becomes true. Add after `canvasRef`:

```javascript
  const inputRef = useRef()
```

Add a useEffect after the hint timer useEffect:

```javascript
  useEffect(() => {
    if (inputOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [inputOpen])
```

Add the ref to the input element:

```javascript
            <input
              ref={inputRef}
              className={styles.input}
```

- [ ] **Step 2: Verify complete visual flow**

Run: `npm run dev`

Full checklist:
- Parchment background with subtle paper grain texture
- Ink brushstroke tree with tapered branches and wobble
- Faint sky wash (if weather is not clear)
- Soft ground bleed at tree base
- Muted ink-wash leaves with translucent opacity and organic distortion
- New leaves bloom in (fade + blur decrease) rather than bounce
- Gentle sway animation (1–3 degree range)
- Tapping own leaf shows parchment-toned tooltip
- Enso circle at bottom — tapping opens input
- Input has ink-line underline, types in dark ink on parchment
- Submit closes input, shows enso again
- Tapping background closes input
- Particle effects render as ink strokes/dots/washes (test by changing weather fallback)
- All text is dark ink on parchment — no white text remaining

- [ ] **Step 3: Commit**

```bash
git add src/Tree.jsx
git commit -m "feat: auto-focus input on open, complete sumi-e redesign"
```
