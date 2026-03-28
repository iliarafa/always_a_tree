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

// Returns leaf color palettes based on temp + condition
function weatherToVisuals(tempC, condition, windspeedKmh) {
  // --- leaf palettes ---
  const palettes = {
    summer: [
      { f: '#5DCAA5', v: '#0a3d29' },
      { f: '#3a9e70', v: '#0a3d29' },
      { f: '#9FE1CB', v: '#0a3d29' },
      { f: '#1D9E75', v: '#04342C' },
    ],
    transition: [
      { f: '#97C459', v: '#27500A' },
      { f: '#EF9F27', v: '#6b3a00' },
      { f: '#5DCAA5', v: '#0a3d29' },
      { f: '#FAC775', v: '#633806' },
    ],
    autumn: [
      { f: '#EF9F27', v: '#6b3a00' },
      { f: '#D85A30', v: '#4A1B0C' },
      { f: '#FAC775', v: '#633806' },
      { f: '#BA7517', v: '#412402' },
    ],
    winter: [
      { f: '#B4B2A9', v: '#444441' },
      { f: '#9FE1CB', v: '#085041' },
      { f: '#D3D1C7', v: '#5F5E5A' },
      { f: '#85B7EB', v: '#0C447C' },
    ],
    snow: [
      { f: '#D3D1C7', v: '#5F5E5A' },
      { f: '#E6F1FB', v: '#185FA5' },
      { f: '#F1EFE8', v: '#888780' },
    ],
    storm: [
      { f: '#085041', v: '#04342C' },
      { f: '#0F6E56', v: '#04342C' },
      { f: '#3B6D11', v: '#173404' },
    ],
    fog: [
      { f: '#888780', v: '#444441' },
      { f: '#B4B2A9', v: '#5F5E5A' },
      { f: '#D3D1C7', v: '#5F5E5A' },
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
    // rain desaturates the base season
    palette = palettes[season].map(c => ({ ...c }))
  } else {
    palette = palettes[season]
  }

  // --- background sky color ---
  const backgrounds = {
    clear: tempC > 15 ? '#0d1a10' : '#0d1218',
    cloudy: '#0e1416',
    fog: '#141616',
    rain: '#0a1014',
    snow: '#0f1318',
    storm: '#080d0a',
  }
  const bg = backgrounds[condition] || '#0d1a12'

  // --- ground glow ---
  const glows = {
    clear: tempC > 15 ? 'rgba(30,80,40,.22)' : 'rgba(20,50,40,.15)',
    cloudy: 'rgba(20,40,30,.10)',
    fog: 'rgba(30,40,30,.08)',
    rain: 'rgba(10,30,20,.08)',
    snow: 'rgba(40,60,70,.12)',
    storm: 'rgba(5,20,10,.06)',
  }
  const glow = glows[condition] || 'rgba(30,80,40,.18)'

  // --- sway speed multiplier from wind ---
  // windspeed 0–10 → 1.0x, 10–30 → up to 0.5x (faster), 30+ → 0.3x
  const swayMultiplier = windspeedKmh < 10
    ? 1.0
    : windspeedKmh < 30
      ? 1.0 - ((windspeedKmh - 10) / 20) * 0.5
      : 0.35

  // --- particles ---
  let particles = 'none'
  if (condition === 'rain' || condition === 'storm') particles = 'rain'
  if (condition === 'snow') particles = 'snow'
  if (condition === 'fog') particles = 'fog'

  return { palette, bg, glow, swayMultiplier, particles, condition, tempC }
}

export async function fetchWeatherVisuals() {
  try {
    // 1. get coordinates
    const coords = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error('no geo')); return }
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        () => reject(new Error('denied')),
        { timeout: 6000 }
      )
    })

    // 2. fetch Open-Meteo (no key required)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weathercode,windspeed_10m&timezone=auto`
    const res = await fetch(url)
    const data = await res.json()
    const { temperature_2m: temp, weathercode: code, windspeed_10m: wind } = data.current

    const condition = wmoToCondition(code)
    return weatherToVisuals(temp, condition, wind)
  } catch (_) {
    // fallback — neutral green, no particles
    return weatherToVisuals(15, 'clear', 5)
  }
}
