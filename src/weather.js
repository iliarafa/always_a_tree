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
