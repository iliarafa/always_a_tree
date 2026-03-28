# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"Always a Tree" is a poetic, weather-reactive web/iOS app where users submit brief thoughts that appear as animated leaves on a procedurally-generated tree. The tree's appearance changes based on real-time weather. Leaves persist in Supabase and sync in real-time across users.

## Commands

```bash
npm run dev          # Dev server on port 5173
npm run build        # Production build (outputs to dist/)
npm run preview      # Preview production build
npm run cap:sync     # Build + sync to iOS (Capacitor)
npm run cap:ios      # Build + sync + open Xcode
```

No test framework is configured.

## Architecture

**Stack**: React 18 + Vite + Supabase + Capacitor 7 (iOS). Plain JavaScript/JSX, CSS Modules, no UI framework.

**Component hierarchy**: `main.jsx → App.jsx → Tree.jsx → [canvas, Particles.jsx, Leaf.jsx[], input]`

- **Tree.jsx** — Main container and state holder. Manages leaves array, weather visuals, Supabase realtime subscription, session tracking (localStorage UUID), and canvas rendering of trunk/branches.
- **useTree.js** — Custom hook for procedural tree geometry generation using seeded RNG. Returns line segments (for canvas) and tip positions (for leaf placement). Memoized, deterministic.
- **Leaf.jsx** — Individual leaf as SVG DOM element with CSS sway animations. Positioned at tree tips. Tapping own leaf shows tooltip.
- **Particles.jsx** — Weather-dependent particle effects (rain/snow/fog) rendered based on conditions.
- **weather.js** — Geolocation + Open-Meteo API fetch. Returns weather code, temperature, wind speed. Drives color palette selection and particle type.
- **supabase.js** — Supabase client initialization.

**Data flow**: Weather fetch on mount → palette/particle selection → tree canvas render. Supabase fetch on mount → leaves positioned at deterministic tips → realtime channel subscribes for new inserts. User input → Supabase insert → realtime broadcast → all clients update.

**Supabase `leaves` table**: `id`, `thought` (max 120 chars), `session_id`, `tip_index`, `created_at`. Queries filter to last 3 days.

## Key Design Decisions

- Tree trunk/branches use canvas for performance; leaves are DOM elements (SVG) for interaction and CSS animation
- Weather palettes (summer/autumn/winter/snow/storm/fog) determined by temperature thresholds and weather codes
- Leaf sway speed scales with wind speed
- Haptic feedback via Capacitor Haptics plugin on iOS
- Capacitor config disables keyboard resize and manages safe areas for full-bleed dark (#0d1a12) design
