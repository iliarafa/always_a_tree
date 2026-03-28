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

function computeTimeOfDay() {
  const h = new Date().getHours()
  if (h >= 5 && h < 7) return 'dawn'
  if (h >= 7 && h < 18) return 'day'
  if (h >= 18 && h < 20) return 'dusk'
  return 'night'
}

function skyGradient(timeOfDay, condition) {
  const clearSky = {
    day:   'linear-gradient(to bottom, #87CEEB, #d4eaf7)',
    dawn:  'linear-gradient(to bottom, #f7b267, #f7d6a8, #87CEEB)',
    dusk:  'linear-gradient(to bottom, #e85d4a, #f0a060, #2a2a4a)',
    night: 'linear-gradient(to bottom, #0a0e1a, #141830)',
  }
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
  return base
}

function inkColor(timeOfDay, condition) {
  const dark = (timeOfDay === 'night') ||
    (condition === 'storm') ||
    (timeOfDay === 'dusk' && condition !== 'clear')
  return dark
    ? { r: 180, g: 175, b: 168 }
    : { r: 42, g: 38, b: 34 }
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

  const timeOfDay = computeTimeOfDay()

  return {
    palette,
    bg: skyGradient(timeOfDay, condition),
    swayMultiplier,
    particles,
    condition,
    tempC,
    timeOfDay,
    ink: inkColor(timeOfDay, condition),
  }
}

export function defaultVisuals() {
  return weatherToVisuals(15, 'clear', 5)
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
