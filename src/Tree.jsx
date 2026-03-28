import { useEffect, useRef, useState, useCallback } from 'react'
import { Leaf } from './Leaf'
import { Particles } from './Particles'
import { useTree } from './useTree'
import { db, THREE_DAYS_AGO } from './supabase'
import { fetchWeatherVisuals } from './weather'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import styles from './Tree.module.css'

async function haptic(style = ImpactStyle.Medium) {
  try { await Haptics.impact({ style }) } catch (_) {}
}

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
  condition: 'clear',
}

function getSession() {
  let id = localStorage.getItem('tree_session')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('tree_session', id) }
  return id
}

function drawInkWash(cx, W, H, intensity, ink) {
  // deterministic ink wash stains near canvas edges
  const rng = makeRng(27182)
  const stains = [
    { x: W * 0.05, y: H * 0.12, rx: 120, ry: 80 },
    { x: W * 0.92, y: H * 0.25, rx: 100, ry: 90 },
    { x: W * 0.08, y: H * 0.72, rx: 150, ry: 70 },
    { x: W * 0.88, y: H * 0.85, rx: 90, ry: 100 },
    { x: W * 0.50, y: H * 0.05, rx: 180, ry: 60 },
  ]
  stains.forEach(s => {
    const alpha = (0.03 + rng() * 0.03) * intensity
    const rot = (rng() - 0.5) * 0.4
    cx.save()
    cx.translate(s.x, s.y)
    cx.rotate(rot)
    const grd = cx.createRadialGradient(0, 0, 0, 0, 0, Math.max(s.rx, s.ry))
    grd.addColorStop(0, `rgba(${ink.r}, ${ink.g}, ${ink.b}, ${alpha.toFixed(4)})`)
    grd.addColorStop(1, `rgba(${ink.r}, ${ink.g}, ${ink.b}, 0)`)
    cx.fillStyle = grd
    cx.beginPath()
    cx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2)
    cx.fill()
    cx.restore()
  })
}

function makeRng(seed) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

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

function drawTree(cx, segs, W, H, condition, timeOfDay, ink) {
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

  // 4. Ink wash stains
  const washIntensity = condition === 'storm' ? 1.8
    : condition === 'rain' ? 1.4
    : condition === 'fog' ? 1.2
    : condition === 'snow' ? 0.8
    : 1.0
  drawInkWash(cx, W, H, washIntensity, ink)

  // 5. Ground ink bleed
  const grd = cx.createRadialGradient(W / 2, H, 0, W / 2, H, 120)
  grd.addColorStop(0, `rgba(${ink.r}, ${ink.g}, ${ink.b}, 0.06)`)
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  cx.fillStyle = grd
  cx.fillRect(0, H - 120, W, 120)

  // 6. Tree branch strokes
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
}

function Ambient({ condition }) {
  const ref = useRef()
  const frameRef = useRef()

  useEffect(() => {
    if (!condition || condition === 'clear' || condition === 'cloudy') return
    const el = ref.current
    if (!el) return

    let lastFlash = 0
    let nextFlash = 8000 + Math.random() * 7000
    let sparkleTimer = 0
    let sparkles = []
    let fogPhase = Math.random() * Math.PI * 2

    function tick(now) {
      // storm: lightning flash
      if (condition === 'storm') {
        if (now - lastFlash > nextFlash) {
          el.style.background = 'rgba(255, 255, 255, 0.04)'
          setTimeout(() => { el.style.background = 'transparent' }, 100)
          lastFlash = now
          nextFlash = 8000 + Math.random() * 7000
        }
      }

      // fog: opacity pulse
      if (condition === 'fog') {
        fogPhase += 0.0008
        const opacity = 0.95 + Math.sin(fogPhase) * 0.05
        el.parentElement.style.opacity = opacity.toFixed(3)
      }

      // snow: sparkle
      if (condition === 'snow') {
        sparkleTimer += 16
        if (sparkleTimer > 2000 + Math.random() * 2000) {
          sparkles.push({
            x: Math.random() * 100,
            y: Math.random() * 80,
            life: 0,
          })
          sparkleTimer = 0
        }
        // render sparkles as tiny dots
        const canvas = el.querySelector('canvas')
        if (canvas) {
          const cx = canvas.getContext('2d')
          cx.clearRect(0, 0, canvas.width, canvas.height)
          sparkles = sparkles.filter(s => {
            s.life += 0.02
            if (s.life > 1) return false
            const alpha = s.life < 0.5 ? s.life * 2 : (1 - s.life) * 2
            cx.beginPath()
            cx.arc(s.x / 100 * canvas.width, s.y / 100 * canvas.height, 1.5, 0, Math.PI * 2)
            cx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.3).toFixed(3)})`
            cx.fill()
            return true
          })
        }
      }

      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frameRef.current)
      if (condition === 'fog' && el.parentElement) {
        el.parentElement.style.opacity = '1'
      }
    }
  }, [condition])

  if (!condition || condition === 'clear' || condition === 'cloudy') return null

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        transition: 'background 0.1s ease',
      }}
    >
      {condition === 'snow' && (
        <canvas
          width={390}
          height={680}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />
      )}
    </div>
  )
}

export function Tree() {
  const canvasRef = useRef()
  const inputRef = useRef()
  const { segs, tips, W, H } = useTree()
  const [leaves, setLeaves] = useState([])
  const [thought, setThought] = useState('')
  const [status, setStatus] = useState('')
  const [hintVisible, setHintVisible] = useState(true)
  const [visuals, setVisuals] = useState(DEFAULT_VISUALS)
  const [inputOpen, setInputOpen] = useState(false)
  const sessionId = useRef(getSession()).current
  const placedIds = useRef(new Set())
  const prevVisualsRef = useRef(null)
  const transitionRef = useRef(null)

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')

    // if no previous visuals, draw immediately
    if (!prevVisualsRef.current) {
      drawTree(cx, segs, W, H, visuals.sky, visuals.ground, visuals.condition)
      prevVisualsRef.current = { sky: visuals.sky, ground: visuals.ground }
      return
    }

    // crossfade: draw old state, overlay new state with increasing alpha
    if (transitionRef.current) cancelAnimationFrame(transitionRef.current)
    const prev = prevVisualsRef.current
    const duration = 2500
    const start = performance.now()

    function animate(now) {
      const t = Math.min((now - start) / duration, 1)
      cx.globalAlpha = 1
      drawTree(cx, segs, W, H, prev.sky, prev.ground, visuals.condition)
      if (t < 1) {
        cx.globalAlpha = t
        drawTree(cx, segs, W, H, visuals.sky, visuals.ground, visuals.condition)
        cx.globalAlpha = 1
        transitionRef.current = requestAnimationFrame(animate)
      } else {
        drawTree(cx, segs, W, H, visuals.sky, visuals.ground, visuals.condition)
        prevVisualsRef.current = { sky: visuals.sky, ground: visuals.ground }
      }
    }
    transitionRef.current = requestAnimationFrame(animate)
    return () => { if (transitionRef.current) cancelAnimationFrame(transitionRef.current) }
  }, [segs, W, H, visuals.sky, visuals.ground, visuals.condition])

  useEffect(() => {
    fetchWeatherVisuals().then(v => setVisuals(v))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setHintVisible(false), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (inputOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [inputOpen])

  const addLeaf = useCallback((row, isNew = false) => {
    if (placedIds.current.has(row.id)) return
    placedIds.current.add(row.id)
    setLeaves(prev => [...prev, { ...row, isNew }])
  }, [])

  useEffect(() => {
    db.from('leaves')
      .select('*')
      .gte('created_at', THREE_DAYS_AGO())
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { setStatus('could not reach the tree'); return }
        data.forEach(row => addLeaf(row, false))
      })
  }, [addLeaf])

  useEffect(() => {
    const channel = db.channel('leaves')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leaves' }, payload => {
        addLeaf(payload.new, true)
      })
      .subscribe()
    return () => db.removeChannel(channel)
  }, [addLeaf])

  async function handleSubmit() {
    const text = thought.trim()
    if (!text) return
    setThought('')
    const tipIdx = Math.floor(Math.random() * tips.length)
    const { data, error } = await db
      .from('leaves')
      .insert({ thought: text, session_id: sessionId, tip_index: tipIdx })
      .select()
      .single()
    if (error) {
      setStatus('the wind took it')
      setTimeout(() => setStatus(''), 2500)
      return
    }
    await haptic(ImpactStyle.Medium)
    addLeaf(data, true)
    setInputOpen(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
  }

  return (
    <div className={styles.wrap} style={{ background: visuals.bg, transition: 'background 2.5s ease' }} onClick={() => setInputOpen(false)}>
      <canvas ref={canvasRef} className={styles.canvas} width={W} height={H} />
      <Particles type={visuals.particles} layer="back" W={W} H={H} segs={segs} tips={tips} />
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
              tipAngle={tip.angle}
              W={W}
              H={H}
              isNew={row.isNew}
              palette={visuals.palette}
              swayMultiplier={visuals.swayMultiplier}
            />
          )
        })}
      </div>
      <Particles type={visuals.particles} layer="front" W={W} H={H} segs={segs} tips={tips} />
      <Ambient condition={visuals.condition} />
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
            ref={inputRef}
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
}
