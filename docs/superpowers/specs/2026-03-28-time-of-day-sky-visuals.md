# Time-of-Day Sky Visuals

## Context

The app currently has weather-reactive visuals (rain, snow, fog, storm particles) but no awareness of time of day. The background is always parchment `#f4f0e8`. This spec adds time-of-day detection and literal sky visuals: sun, moon, stars, dusk/dawn colors, and storm clouds.

## Data Source

Extend the existing Open-Meteo API call to include `is_day`, `sunrise`, and `sunset`:

```
&current=temperature_2m,weathercode,windspeed_10m,is_day
&daily=sunrise,sunset
&timezone=auto
```

No new API calls. `fetchWeatherVisuals()` returns two additional fields: `timeOfDay` (one of `day`, `night`, `dawn`, `dusk`) and `isDay` (boolean).

### Time State Calculation

- **Dawn**: sunrise - 40min → sunrise + 40min
- **Day**: sunrise + 40min → sunset - 40min
- **Dusk**: sunset - 40min → sunset + 40min
- **Night**: sunset + 40min → sunrise - 40min

Parse sunrise/sunset as ISO timestamps from `daily` response. Compare against device local time.

## Background Colors

Backgrounds shift from flat parchment to literal sky gradients on the wrapper div. The parchment texture in `index.css` (repeating-conic-gradient) is removed — it doesn't work on colored skies.

### Clear Sky

| State | Gradient (top → bottom) |
|-------|------------------------|
| Day   | `#87CEEB → #d4eaf7`   |
| Dawn  | `#f7b267 → #f7d6a8 → #87CEEB` |
| Dusk  | `#e85d4a → #f0a060 → #2a2a4a` |
| Night | `#0a0e1a → #141830`   |

### Weather Overrides (day / night)

| Condition | Day | Night |
|-----------|-----|-------|
| Cloudy | `#9eaab4 → #c8cdd2` | `#1a1e28 → #2a2e38` |
| Rain   | `#6e7a84 → #a0a8b0` | `#10141e → #1e222c` |
| Storm  | `#3a3e48 → #5a5e68` | `#08080e → #141418` |
| Snow   | `#c8d0d8 → #e0e4e8` | `#1e2230 → #2a2e3c` |
| Fog    | `#b0b8be → #d0d4d8` | `#181c24 → #282c34` |

Dawn/dusk + weather: blend the weather palette with the dawn/dusk warm tones (mix at 50%).

Transition: existing 2.5s CSS `transition: background 2.5s ease` on `.wrap`.

## Tree Ink Color Adaptation

- Light backgrounds (day, dawn, dusk): current dark brown `rgba(42, 38, 34, α)`
- Dark backgrounds (night, storm): shift to lighter `rgba(180, 175, 168, α)` so branches remain visible

The alpha curve (0.2 tips → 0.8 trunk) stays the same.

## Sky Elements

All drawn on the existing tree canvas in `drawTree()`, rendered **before** ink wash stains and branches (behind everything).

### Sun (Day + Clear/Cloudy)

- Radial gradient circle, upper-right area of canvas
- Warm glow: center `rgba(255, 220, 100, 0.9)` fading to transparent
- Size: ~40px radius
- On cloudy: dimmer (lower opacity), more diffused (larger radius)
- Not shown during rain/storm/snow/fog

### Moon (Night + Clear/Cloudy)

- Upper-left area of canvas
- Crescent effect: two overlapping circles — bright silver `rgba(220, 225, 235, 0.85)` with dark offset
- Soft glow halo around it
- Size: ~20px radius
- Shown on clear and cloudy nights. Hidden during rain/storm/snow/fog

### Stars (Night + Clear only)

- ~20-30 tiny dots in the upper 40% of canvas
- Varying size (1-2.5px) and opacity (0.4-0.8)
- Positioned deterministically using seeded RNG (consistent across renders)
- Pale silver-white `rgba(220, 225, 240, α)`
- **Twinkle**: Handled in Ambient component. Subtle opacity oscillation per star on a slow random cycle (~3-6s period). Gentle breathing, not flashy.
- Only on clear nights — no stars when cloudy/rain/storm/snow/fog

### Storm Clouds (Storm condition only)

- 2-3 overlapping ink-wash ellipses in upper portion of canvas
- Dark charcoal `rgba(20, 20, 25, 0.7)` for main mass
- Grey `rgba(60, 60, 68, 0.5)` for lighter wisps
- Soft radial gradients, no hard edges
- Rain gets a lighter, more diffused version (1-2 ellipses, lower opacity)

### Lightning (Storm only)

- Reuses existing Ambient flash mechanism
- Brief white overlay `rgba(255, 255, 240, 0.12)`, ~100ms duration
- Random interval: 8-20 seconds between flashes
- Occasional double-flash: two 80ms flashes with 120ms gap
- Subtle — distant lightning illuminating clouds, not direct strikes

## Canvas Rendering Order

1. `cx.clearRect(0, 0, W, H)`
2. Stars (night + clear)
3. Moon (night) or Sun (day)
4. Storm clouds (storm condition)
5. Ink wash stains (existing)
6. Sky wash gradient (existing, may need adjustment for new backgrounds)
7. Ground ink bleed (existing)
8. Tree branch strokes (existing)

## Files to Modify

- **`src/weather.js`** — Add `is_day`, `sunrise`, `sunset` to API call. Add `timeOfDay` calculation. Add background gradient and ink color to returned visuals. Restructure `bg` from flat color to gradient string.
- **`src/Tree.jsx`** — `drawTree()` gets new sky element rendering (sun/moon/stars/clouds) before existing ink wash. Ambient component gets star twinkle animation. Lightning interval updated (8-20s).
- **`src/index.css`** — Remove parchment texture (repeating-conic-gradient). Body background becomes a dark fallback.
- **`src/Tree.module.css`** — No changes expected.

## Verification

1. Run `npm run dev` and test with clear weather during daytime — should see blue sky gradient + sun
2. Manually override `timeOfDay` to `night` in weather.js return — verify dark background, moon, stars, light-colored tree ink
3. Override to `dusk` — verify warm gradient colors
4. Override condition to `storm` — verify dark clouds, lightning flashes at 8-20s intervals
5. Override to `dawn` — verify amber-rose gradient
6. Build for iOS with `npm run cap:ios` and verify on simulator
