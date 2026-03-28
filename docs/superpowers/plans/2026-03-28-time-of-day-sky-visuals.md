# Time-of-Day Sky Visuals — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add time-of-day awareness (day/night/dawn/dusk) with literal sky backgrounds, sun, moon, stars, storm clouds, and lightning.

**Architecture:** Extend `weather.js` to fetch sunrise/sunset and compute `timeOfDay`. Return sky gradient + ink color. Draw sky elements (sun/moon/stars/clouds) on the existing tree canvas before branches. Ambient component handles star twinkle and lightning.

**Tech Stack:** React 18, Canvas 2D, Open-Meteo API, CSS gradients

**No test framework configured** — verification is manual via dev server and iOS simulator.

---

## File Structure

| File | Role | Change |
|------|------|--------|
| `src/weather.js` | Weather data + visual mapping | Modify: add time-of-day, sky gradients, ink color |
| `src/Tree.jsx` | Canvas rendering + Ambient | Modify: sky element drawing, ink color, star twinkle, lightning |
| `src/index.css` | Global styles | Modify: remove parchment texture |
| `src/Tree.module.css` | UI element styles | Modify: adapt hint/input colors for dark backgrounds |

---

### Task 1: Extend weather.js — time-of-day + sky gradients

**Files:**
- Modify: `src/weather.js`

- [ ] **Step 1: Add sunrise/sunset to API call**

In `fetchWeatherVisuals()`, change the URL to include `is_day` and `daily=sunrise,sunset`:

```javascript
const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weathercode,windspeed_10m,is_day&daily=sunrise,sunset&timezone=auto`
```

Extract the new fields from the response:

```javascript
const { temperature_2m: temp, weathercode: code, windspeed_10m: wind, is_day: isDay } = data.current
const { sunrise: [sunriseStr], sunset: [sunsetStr] } = data.daily
```

Pass `isDay`, `sunriseStr`, `sunsetStr` into `weatherToVisuals`.

- [ ] **Step 2: Add timeOfDay calculation**

Add a helper function above `weatherToVisuals`:

```javascript
function computeTimeOfDay(sunriseStr, sunsetStr) {
  const now = Date.now()
  const sunrise = new Date(sunriseStr).getTime()
  const sunset = new Date(sunsetStr).getTime()
  const margin = 40 * 60 * 1000 // 40 minutes in ms

  if (now >= sunrise - margin && now < sunrise + margin) return 'dawn'
  if (now >= sunrise + margin && now < sunset - margin) return 'day'
  if (now >= sunset - margin && now < sunset + margin) return 'dusk'
  return 'night'
}
```

- [ ] **Step 3: Replace bg/sky/ground with gradient-based visuals**

Replace the `skyWash`, `groundBleed`, and `bg` logic in `weatherToVisuals` with a new system. Add `sunriseStr`, `sunsetStr` as parameters to `weatherToVisuals`.

Compute `timeOfDay` using the helper. Build sky gradients:

```javascript
function skyGradient(timeOfDay, condition) {
  // Clear sky gradients
  const clearSky = {
    day:   'linear-gradient(to bottom, #87CEEB, #d4eaf7)',
    dawn:  'linear-gradient(to bottom, #f7b267, #f7d6a8, #87CEEB)',
    dusk:  'linear-gradient(to bottom, #e85d4a, #f0a060, #2a2a4a)',
    night: 'linear-gradient(to bottom, #0a0e1a, #141830)',
  }

  // Weather override gradients (day / night variants)
  const weatherDay = {
    cloudy: 'linear-gradient(to bottom, #9eaab4, #c8cdd2)',
    rain:   'linear-gradient(to bottom, #6e7a84, #a0a8b0)',
    storm:  'linear-gradient(to bottom, #3a3e48, #5a5e68)',
    snow:   'linear-gradient(to bottom, #c8d0d8, #e0e4e8)',
    fog:    'linear-gradient(to bottom, #b0b8be, #d0d4d8)',
  }
  const weatherNight = {
    cloudy: 'linear-gradient(to bottom, #1a1e28, #2a2e38)',
    rain:   'linear-gradient(to bottom, #10141e, #1e222c)',
    storm:  'linear-gradient(to bottom, #08080e, #141418)',
    snow:   'linear-gradient(to bottom, #1e2230, #2a2e3c)',
    fog:    'linear-gradient(to bottom, #181c24, #282c34)',
  }

  if (condition === 'clear') return clearSky[timeOfDay]

  const isNight = timeOfDay === 'night'
  const base = isNight ? weatherNight[condition] : weatherDay[condition]
  if (!base) return clearSky[timeOfDay]

  // Dawn/dusk + weather: use weather palette (dawn/dusk tint is subtle enough from the gradient)
  if (timeOfDay === 'dawn' || timeOfDay === 'dusk') return base
  return base
}
```

Determine ink color based on background brightness:

```javascript
function inkColor(timeOfDay, condition) {
  const dark = (timeOfDay === 'night') ||
    (condition === 'storm') ||
    (timeOfDay === 'dusk' && condition !== 'clear')
  return dark
    ? { r: 180, g: 175, b: 168 }  // light ink for dark backgrounds
    : { r: 42, g: 38, b: 34 }     // dark ink for light backgrounds
}
```

- [ ] **Step 4: Update return value**

Change the return of `weatherToVisuals` to include the new fields and remove old `sky`/`ground` canvas wash values (these are replaced by CSS gradient backgrounds):

```javascript
return {
  palette, bg: skyGradient(timeOfDay, condition),
  swayMultiplier, particles, condition, tempC,
  timeOfDay, ink: inkColor(timeOfDay, condition),
}
```

Update the fallback in the `catch` block:

```javascript
return weatherToVisuals(15, 'clear', 5, null, null)
```

When `sunriseStr`/`sunsetStr` are null, `computeTimeOfDay` should default to `'day'`:

```javascript
function computeTimeOfDay(sunriseStr, sunsetStr) {
  if (!sunriseStr || !sunsetStr) return 'day'
  // ... rest of function
}
```

- [ ] **Step 5: Commit**

```bash
git add src/weather.js
git commit -m "feat: add time-of-day detection and sky gradient backgrounds"
```

---

### Task 2: Update index.css and Tree.module.css

**Files:**
- Modify: `src/index.css`
- Modify: `src/Tree.module.css`

- [ ] **Step 1: Remove parchment texture from index.css**

Replace the body background with a dark fallback (visible briefly before React mounts):

```css
html, body, #root {
  width: 100%;
  height: 100%;
  min-height: 100dvh;
  overflow: hidden;
  background: #0a0e1a;
}
```

- [ ] **Step 2: Adapt UI element colors for dark/light backgrounds**

In `Tree.module.css`, the hint text, input border, input text, and placeholder use hardcoded dark brown `rgba(42, 38, 34, ...)`. These won't be visible on dark backgrounds.

These will be set via inline styles in Tree.jsx (Task 4) using the `ink` color from visuals, so no CSS changes needed here — but we need to add CSS custom properties as the mechanism. Add to `.wrap`:

```css
.wrap {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  font-family: Georgia, serif;
  --ink: 42, 38, 34;
}
```

Then update all `rgba(42, 38, 34, ...)` references in Tree.module.css to use `var(--ink)`:

- `.hint`: `color: rgba(var(--ink), 0.25);`
- `.input`: `color: rgba(var(--ink), 0.85);` and `border-bottom: 1px solid rgba(var(--ink), 0.15);` and `caret-color: rgba(var(--ink), 0.4);`
- `.input::placeholder`: `color: rgba(var(--ink), 0.2);`
- `.status`: `color: rgba(var(--ink), 0.25);`
- `.enso path` stroke — this is inline in JSX, will be handled in Task 4

- [ ] **Step 3: Commit**

```bash
git add src/index.css src/Tree.module.css
git commit -m "feat: replace parchment texture with dark fallback, add CSS ink variable"
```

---

### Task 3: Draw sky elements on canvas

**Files:**
- Modify: `src/Tree.jsx`

- [ ] **Step 1: Add sky element drawing functions**

Add these functions above `drawTree` in Tree.jsx. They all use the existing `makeRng` helper.

**Stars:**

```javascript
function drawStars(cx, W, H) {
  const rng = makeRng(31337)
  const count = 25
  for (let i = 0; i < count; i++) {
    const x = rng() * W
    const y = rng() * H * 0.4
    const r = 0.5 + rng() * 1.0
    const alpha = 0.4 + rng() * 0.4
    cx.beginPath()
    cx.arc(x, y, r, 0, Math.PI * 2)
    cx.fillStyle = `rgba(220, 225, 240, ${alpha.toFixed(2)})`
    cx.fill()
  }
}
```

**Sun:**

```javascript
function drawSun(cx, W, condition) {
  const x = W * 0.78
  const y = 65
  const isCloudy = condition === 'cloudy'
  const radius = isCloudy ? 55 : 40
  const alpha = isCloudy ? 0.4 : 0.9

  const grd = cx.createRadialGradient(x, y, 0, x, y, radius)
  grd.addColorStop(0, `rgba(255, 220, 100, ${alpha})`)
  grd.addColorStop(0.4, `rgba(255, 200, 60, ${alpha * 0.4})`)
  grd.addColorStop(1, 'rgba(255, 200, 60, 0)')
  cx.fillStyle = grd
  cx.beginPath()
  cx.arc(x, y, radius, 0, Math.PI * 2)
  cx.fill()
}
```

**Moon:**

```javascript
function drawMoon(cx, W, condition) {
  const x = W * 0.22
  const y = 55
  const r = 18
  const isCloudy = condition === 'cloudy'
  const alpha = isCloudy ? 0.4 : 0.85

  // glow halo
  const glow = cx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.5)
  glow.addColorStop(0, `rgba(200, 210, 230, ${(alpha * 0.2).toFixed(2)})`)
  glow.addColorStop(1, 'rgba(200, 210, 230, 0)')
  cx.fillStyle = glow
  cx.beginPath()
  cx.arc(x, y, r * 2.5, 0, Math.PI * 2)
  cx.fill()

  // bright disc
  cx.beginPath()
  cx.arc(x, y, r, 0, Math.PI * 2)
  cx.fillStyle = `rgba(220, 225, 235, ${alpha.toFixed(2)})`
  cx.fill()

  // dark offset for crescent
  cx.beginPath()
  cx.arc(x + 7, y - 3, r * 0.85, 0, Math.PI * 2)
  cx.fillStyle = '#0a0e1a'
  cx.fill()
}
```

**Storm clouds:**

```javascript
function drawStormClouds(cx, W, condition) {
  const clouds = [
    { x: W * 0.25, y: 50, rx: 110, ry: 45 },
    { x: W * 0.65, y: 35, rx: 130, ry: 50 },
    { x: W * 0.45, y: 70, rx: 100, ry: 35 },
  ]
  const isStorm = condition === 'storm'
  const count = isStorm ? 3 : 2
  const alphaBase = isStorm ? 0.7 : 0.3

  for (let i = 0; i < count; i++) {
    const c = clouds[i]
    const grd = cx.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.max(c.rx, c.ry))
    const alpha = alphaBase - i * 0.15
    grd.addColorStop(0, `rgba(20, 20, 25, ${alpha.toFixed(2)})`)
    grd.addColorStop(0.6, `rgba(40, 40, 48, ${(alpha * 0.5).toFixed(2)})`)
    grd.addColorStop(1, 'rgba(60, 60, 68, 0)')
    cx.fillStyle = grd
    cx.beginPath()
    cx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2)
    cx.fill()
  }
}
```

- [ ] **Step 2: Update drawTree signature and rendering order**

Change `drawTree` to accept `timeOfDay`, `ink`, and `condition`:

```javascript
function drawTree(cx, segs, W, H, condition, timeOfDay, ink) {
```

New rendering order inside `drawTree`:

```javascript
cx.clearRect(0, 0, W, H)

// 1. Stars (night + clear only)
if (timeOfDay === 'night' && condition === 'clear') {
  drawStars(cx, W, H)
}

// 2. Moon (night + clear/cloudy) or Sun (day + clear/cloudy)
if (timeOfDay === 'night' && (condition === 'clear' || condition === 'cloudy')) {
  drawMoon(cx, W, condition)
} else if (timeOfDay === 'day' && (condition === 'clear' || condition === 'cloudy')) {
  drawSun(cx, W, condition)
}

// 3. Storm/rain clouds
if (condition === 'storm' || condition === 'rain') {
  drawStormClouds(cx, W, condition)
}

// 4. Ink wash stains (existing)
const washIntensity = condition === 'storm' ? 1.8
  : condition === 'rain' ? 1.4
  : condition === 'fog' ? 1.2
  : condition === 'snow' ? 0.8
  : 1.0
drawInkWash(cx, W, H, washIntensity)

// 5. Ground ink bleed (existing)
const grd = cx.createRadialGradient(W / 2, H, 0, W / 2, H, 120)
grd.addColorStop(0, `rgba(${ink.r}, ${ink.g}, ${ink.b}, 0.06)`)
grd.addColorStop(1, 'rgba(0,0,0,0)')
cx.fillStyle = grd
cx.fillRect(0, H - 120, W, 120)

// 6. Tree branch strokes (existing, now using ink color)
cx.lineCap = 'round'
segs.forEach(s => {
  const t = s.d / 8
  const alpha = 0.2 + t * 0.6
  const width = 0.4 + (t * t) * 4.1

  const wobble = Math.sin(s.x1 * 0.3 + s.y1 * 0.5) * 0.8
  const mx = (s.x1 + s.x2) / 2 + wobble
  const my = (s.y1 + s.y2) / 2 + wobble * 0.5

  cx.lineWidth = width
  cx.strokeStyle = `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${alpha.toFixed(3)})`
  cx.beginPath()
  cx.moveTo(s.x1, s.y1)
  cx.quadraticCurveTo(mx, my, s.x2, s.y2)
  cx.stroke()
})
```

Remove the old `sky` parameter and the sky wash gradient block (the CSS gradient background replaces it).

- [ ] **Step 3: Update drawInkWash to use ink color**

Change `drawInkWash` to accept `ink` and use it instead of hardcoded `42, 38, 34`:

```javascript
function drawInkWash(cx, W, H, intensity, ink) {
  // ... existing stain positions ...
  stains.forEach(s => {
    const alpha = (0.03 + rng() * 0.03) * intensity
    // ...
    grd.addColorStop(0, `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${alpha.toFixed(4)})`)
    grd.addColorStop(1, `rgba(${ink.r}, ${ink.g}, ${ink.b}, 0)`)
    // ...
  })
}
```

Update the call in `drawTree`: `drawInkWash(cx, W, H, washIntensity, ink)`

- [ ] **Step 4: Commit**

```bash
git add src/Tree.jsx
git commit -m "feat: draw sun, moon, stars, storm clouds on canvas"
```

---

### Task 4: Wire up Tree component to new visuals

**Files:**
- Modify: `src/Tree.jsx`

- [ ] **Step 1: Update DEFAULT_VISUALS**

```javascript
const DEFAULT_VISUALS = {
  palette: [
    { f: '#8aaa7e', v: '#4a5e42' },
    { f: '#a3b89a', v: '#5a6e52' },
    { f: '#6b8c62', v: '#3d5235' },
  ],
  bg: 'linear-gradient(to bottom, #87CEEB, #d4eaf7)',
  swayMultiplier: 1,
  particles: 'none',
  condition: 'clear',
  timeOfDay: 'day',
  ink: { r: 42, g: 38, b: 34 },
}
```

- [ ] **Step 2: Update drawTree calls in the render effect**

In the `useEffect` that calls `drawTree`, update all call sites to use the new signature:

```javascript
// immediate draw (no previous visuals)
drawTree(cx, segs, W, H, visuals.condition, visuals.timeOfDay, visuals.ink)

// crossfade animate
drawTree(cx, segs, W, H, visuals.condition, prev.timeOfDay, prev.ink)
// ... and the overlay:
drawTree(cx, segs, W, H, visuals.condition, visuals.timeOfDay, visuals.ink)
```

Update `prevVisualsRef` to store `timeOfDay` and `ink`:

```javascript
prevVisualsRef.current = { timeOfDay: visuals.timeOfDay, ink: visuals.ink }
```

Update the effect dependency array:

```javascript
}, [segs, W, H, visuals.condition, visuals.timeOfDay, visuals.ink])
```

- [ ] **Step 3: Set CSS --ink variable on wrapper**

In the JSX `<div className={styles.wrap}>`, update the style:

```jsx
<div
  className={styles.wrap}
  style={{
    background: visuals.bg,
    transition: 'background 2.5s ease',
    '--ink': `${visuals.ink.r}, ${visuals.ink.g}, ${visuals.ink.b}`,
  }}
  onClick={() => setInputOpen(false)}
>
```

- [ ] **Step 4: Update enso circle stroke to use ink color**

The enso SVG has a hardcoded stroke. Update it:

```jsx
stroke={`rgba(${visuals.ink.r}, ${visuals.ink.g}, ${visuals.ink.b}, 0.3)`}
```

- [ ] **Step 5: Commit**

```bash
git add src/Tree.jsx
git commit -m "feat: wire tree component to time-of-day visuals and ink color"
```

---

### Task 5: Star twinkle + lightning in Ambient

**Files:**
- Modify: `src/Tree.jsx` (Ambient component)

- [ ] **Step 1: Update Ambient to accept timeOfDay**

Change `Ambient` props to `{ condition, timeOfDay }`. Update the early return:

```javascript
function Ambient({ condition, timeOfDay }) {
```

Remove the early return that skips `clear`/`cloudy` — we now need Ambient for star twinkle on clear nights:

```javascript
// Old: if (!condition || condition === 'clear' || condition === 'cloudy') return null
// New: only skip if truly nothing to do
const needsAmbient = condition === 'storm' || condition === 'fog' || condition === 'snow' ||
  (timeOfDay === 'night' && condition === 'clear')
if (!needsAmbient) return null
```

Update the matching guard at the top of the `useEffect` as well.

- [ ] **Step 2: Add star twinkle animation**

Inside the `tick` function, add a star twinkle block. The stars are drawn on the main canvas, but we overlay subtle brightness pulses on the Ambient canvas:

```javascript
// night + clear: star twinkle overlay
if (timeOfDay === 'night' && condition === 'clear') {
  const canvas = el.querySelector('canvas')
  if (canvas) {
    const cx = canvas.getContext('2d')
    // Don't clear if snow sparkles also running (they won't be — clear night)
    cx.clearRect(0, 0, canvas.width, canvas.height)
    const rng2 = makeRng(31337) // same seed as drawStars
    for (let i = 0; i < 25; i++) {
      const x = rng2() * canvas.width
      const y = rng2() * canvas.height * 0.4
      const r = 0.5 + rng2() * 1.0
      const baseAlpha = 0.4 + rng2() * 0.4
      // each star has its own phase, period 3-6s
      const period = 3000 + i * 130
      const twinkle = Math.sin(now / period + i * 1.7) * 0.3
      const alpha = Math.max(0, baseAlpha + twinkle)
      cx.beginPath()
      cx.arc(x, y, r + 0.3, 0, Math.PI * 2)
      cx.fillStyle = `rgba(220, 225, 240, ${(alpha * 0.5).toFixed(3)})`
      cx.fill()
    }
  }
}
```

- [ ] **Step 3: Update lightning for double-flash**

In the storm block of the `tick` function, add occasional double-flash:

```javascript
if (condition === 'storm') {
  if (now - lastFlash > nextFlash) {
    el.style.background = 'rgba(255, 255, 240, 0.12)'
    const isDouble = Math.random() > 0.7
    if (isDouble) {
      setTimeout(() => { el.style.background = 'transparent' }, 80)
      setTimeout(() => { el.style.background = 'rgba(255, 255, 240, 0.12)' }, 200)
      setTimeout(() => { el.style.background = 'transparent' }, 280)
    } else {
      setTimeout(() => { el.style.background = 'transparent' }, 100)
    }
    lastFlash = now
    nextFlash = 8000 + Math.random() * 12000
  }
}
```

- [ ] **Step 4: Render canvas for star twinkle**

Update the return JSX to show canvas for both snow sparkles and star twinkle:

```jsx
return (
  <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', transition: 'background 0.1s ease' }}>
    {(condition === 'snow' || (timeOfDay === 'night' && condition === 'clear')) && (
      <canvas width={390} height={680} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    )}
  </div>
)
```

- [ ] **Step 5: Update Ambient usage in Tree component**

In the Tree component JSX, pass `timeOfDay`:

```jsx
<Ambient condition={visuals.condition} timeOfDay={visuals.timeOfDay} />
```

- [ ] **Step 6: Commit**

```bash
git add src/Tree.jsx
git commit -m "feat: add star twinkle animation and double-flash lightning"
```

---

### Task 6: Verify and polish

- [ ] **Step 1: Test clear day**

Run `npm run dev`. With real weather (assuming daytime), verify:
- Blue sky gradient background
- Sun glow in upper-right
- Dark brown tree ink
- Expected: blue sky, warm sun glow, dark tree

- [ ] **Step 2: Test night mode**

In `weather.js`, temporarily hardcode the return of `computeTimeOfDay` to `'night'` and condition to `'clear'`. Verify:
- Dark indigo background
- Moon crescent upper-left with glow
- Stars in upper 40% with gentle twinkle
- Light grey-brown tree ink
- Revert the hardcode after testing.

- [ ] **Step 3: Test dusk**

Hardcode `computeTimeOfDay` to return `'dusk'`, condition `'clear'`. Verify:
- Red/orange/indigo gradient background
- No sun or moon
- Dark brown ink

- [ ] **Step 4: Test storm**

Hardcode condition to `'storm'`, timeOfDay to `'day'`. Verify:
- Dark grey gradient background
- Storm cloud ellipses in upper area
- Lightning flashes every 8-20s, occasional double-flash
- Light ink color (storm bg is dark)

- [ ] **Step 5: Build for iOS**

```bash
npm run cap:ios
```

Run on simulator. Verify all states render correctly on device.

- [ ] **Step 6: Final commit**

If any polish changes were made during verification:

```bash
git add -A
git commit -m "fix: polish time-of-day sky visuals"
```
