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
}

function getSession() {
  let id = localStorage.getItem('tree_session')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('tree_session', id) }
  return id
}

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
