# Always a Tree

A poetic, weather-reactive web and iOS app where users leave brief thoughts that appear as animated leaves on a procedurally generated tree. The tree's appearance shifts with real-time weather — leaves change color with the seasons, rain splashes on branches, snow settles at tips, and fog wraps around the trunk.

Thoughts persist in Supabase and sync in real-time across all users.

## Stack

React 18, Vite, Supabase (realtime + Postgres), Capacitor 7 (iOS)

## How It Works

- A seeded RNG generates a deterministic tree with ink-stroke branches on canvas
- Users submit thoughts (max 120 characters) that attach as SVG leaves at branch tips
- Weather data from Open-Meteo drives the visual palette, particle effects, and ambient mood
- Leaves sway with the wind, dangle naturally from branches, and each has subtle shape variation
- Everything renders in a sumi-e ink wash aesthetic on parchment

## Getting Started

```bash
npm install
npm run dev          # Dev server on localhost:5173
```

### iOS

```bash
npm run cap:ios      # Build, sync, and open Xcode
```

### Production

```bash
npm run build        # Output to dist/
npm run preview      # Preview the production build
```

## Supabase

The app expects a `leaves` table:

| Column       | Type        | Notes              |
|-------------|-------------|---------------------|
| `id`        | uuid (pk)   | Default `gen_random_uuid()` |
| `thought`   | text        | Max 120 characters  |
| `session_id`| text        | Anonymous user UUID |
| `tip_index` | integer     | Branch tip position |
| `created_at`| timestamptz | Default `now()`     |

Queries filter to the last 3 days. Realtime is enabled on the `leaves` table for live inserts.

## Architecture

```
main.jsx → App.jsx → Landing.jsx (splash)
                    → Tree.jsx (main container)
                        ├── canvas (trunk/branches + ink wash background)
                        ├── Particles.jsx (back layer — rain/snow/fog behind tree)
                        ├── Leaf.jsx[] (SVG leaves as DOM elements)
                        ├── Particles.jsx (front layer — blurred foreground particles)
                        └── Ambient (storm flash, fog pulse, snow sparkle)
```

- **useTree.js** — Procedural tree geometry via seeded RNG. Returns segments for canvas and tip positions (with angles) for leaf placement
- **weather.js** — Geolocation + Open-Meteo API. Returns palette, particle type, sway multiplier, and ambient condition
- **Particles.jsx** — Dual-layer weather particles with tree interaction (rain splashes on branches, snow settles at tips, fog wraps trunk)

## License

MIT
