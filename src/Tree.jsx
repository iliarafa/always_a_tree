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
    { f: '#5DCAA5', v: '#0a3d29' },
    { f: '#9FE1CB', v: '#0a3d29' },
    { f: '#3a9e70', v: '#0a3d29' },
  ],
  bg: '#0d1a12',
  glow: 'rgba(30,80,40,.18)',
  swayMultiplier: 1,
  particles: 'none',
}

function getSession() {
  let id = localStorage.getItem('tree_session')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('tree_session', id) }
  return id
}

function drawTree(cx, segs, W, H, glow) {
  cx.clearRect(0, 0, W, H)
  const grd = cx.createRadialGradient(W / 2, H, 0, W / 2, H, 90)
  grd.addColorStop(0, glow)
  grd.addColorStop(1, 'rgba(0,0,0,0)')
  cx.fillStyle = grd
  cx.fillRect(0, H - 90, W, 90)
  cx.lineCap = 'round'
  segs.forEach(s => {
    const t = s.d / 7
    cx.lineWidth = Math.max(.8, s.d * 1.4)
    cx.strokeStyle = `rgb(${~~(55 + t * 45)},${~~(30 + t * 22)},${~~(12 + t * 10)})`
    cx.beginPath(); cx.moveTo(s.x1, s.y1); cx.lineTo(s.x2, s.y2); cx.stroke()
  })
}

export function Tree() {
  const canvasRef = useRef()
  const { segs, tips, W, H } = useTree()
  const [leaves, setLeaves] = useState([])
  const [thought, setThought] = useState('')
  const [status, setStatus] = useState('')
  const [hintVisible, setHintVisible] = useState(true)
  const [visuals, setVisuals] = useState(DEFAULT_VISUALS)
  const sessionId = useRef(getSession()).current
  const placedIds = useRef(new Set())

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const cx = cv.getContext('2d')
    drawTree(cx, segs, W, H, visuals.glow)
  }, [segs, W, H, visuals.glow])

  useEffect(() => {
    fetchWeatherVisuals().then(v => setVisuals(v))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setHintVisible(false), 4000)
    return () => clearTimeout(t)
  }, [])

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
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
  }

  return (
    <div className={styles.wrap} style={{ background: visuals.bg }} onClick={() => {}}>
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
      <div className={styles.bottom}>
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
  )
}
