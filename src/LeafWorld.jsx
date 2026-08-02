import { useEffect, useRef, useState } from 'react'
import { VEINS } from './leafShapes'
import styles from './LeafWorld.module.css'

// keep in sync with the exit transition durations in LeafWorld.module.css
const OUT_MS = 550

// linear mix between two hex colors, t in [0,1]
function mix(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16)
  const b = parseInt(hexB.slice(1), 16)
  const ch = sh => Math.round(((a >> sh) & 255) + (((b >> sh) & 255) - ((a >> sh) & 255)) * t)
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`
}

// map any angle into (-180, 180] so the fly-in takes the shortest rotational path
function normDeg(deg) {
  let d = deg % 360
  if (d > 180) d -= 360
  if (d <= -180) d += 360
  return d
}

export function LeafWorld({ row, rect, swayRot, shape, color, baseRotDeg, closing, onClose, onClosed, wrapRef }) {
  const [engaged, setEngaged] = useState(false)
  const dialogRef = useRef()

  // start pose: the overlay (authored at viewport size) transform-scaled down
  // onto the tapped leaf's screen rect — computed once against .wrap's rect
  const [pose] = useState(() => {
    const wrap = wrapRef.current.getBoundingClientRect()
    // slice cover-scale of the 14×26 viewBox inside the 144%-of-viewport svg
    // box: k = rendered px per viewBox unit → artwork height at scale 1 is 26k
    const k = Math.max((1.44 * wrap.width) / 14, (1.44 * wrap.height) / 26)
    return {
      tx: rect.left + rect.width / 2 - (wrap.left + wrap.width / 2),
      ty: rect.top + rect.height / 2 - (wrap.top + wrap.height / 2),
      s: Math.max(rect.height / (26 * k), 0.005),
      rot: normDeg(baseRotDeg + swayRot),
    }
  })

  // double-rAF: first paint holds the at-leaf pose so WebKit uploads the
  // texture before the transition starts (hides the first-frame hitch)
  useEffect(() => {
    let id2
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => setEngaged(true))
    })
    return () => { cancelAnimationFrame(id1); if (id2) cancelAnimationFrame(id2) }
  }, [])

  // completion by timer, not transitionend — reduced-motion removes the
  // transform transition and backgrounded tabs swallow the event
  useEffect(() => {
    if (!closing) return
    const t = setTimeout(onClosed, OUT_MS + 60)
    return () => clearTimeout(t)
  }, [closing, onClosed])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      // the background is inert while we're open — keep Tab inside the dialog
      if (e.key === 'Tab') { e.preventDefault(); dialogRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // captured at construction, not in the effect: under StrictMode the effect
  // re-runs after the dialog already took focus and would capture itself
  const [opener] = useState(() => document.activeElement)

  useEffect(() => {
    dialogRef.current?.focus()
    return () => {
      // rAF: the originating leaf is still visibility:hidden during this
      // commit — refocus once it has been un-hidden
      if (opener instanceof HTMLElement) {
        requestAnimationFrame(() => { if (opener.isConnected) opener.focus() })
      }
    }
  }, [opener])

  const open = engaged && !closing

  return (
    <div
      ref={dialogRef}
      className={`${styles.overlay} ${open ? styles.open : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="a thought"
      tabIndex={-1}
      onClick={e => { e.stopPropagation(); if (!closing) onClose() }}
      style={{
        '--tx': `${pose.tx.toFixed(1)}px`,
        '--ty': `${pose.ty.toFixed(1)}px`,
        '--s': pose.s.toFixed(4),
        '--rot': `${pose.rot.toFixed(1)}deg`,
        '--leaf': color.f,
        '--l0': mix(color.f, '#ffffff', 0.55),
        '--l1': mix(color.f, '#ffffff', 0.15),
        '--l2': mix(color.f, color.v, 0.45),
        '--vein': mix(color.v, color.f, 0.3),
        '--text': mix(color.v, '#1a1613', 0.35),
      }}
    >
      <div className={styles.backdrop} />
      <div className={styles.zoomLeaf}>
        <svg className={styles.leafSvg} viewBox="0 0 14 26" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* user units — the softness scales with the leaf (~8-10px at full size).
                no turbulence/displacement: fullscreen fractal noise hitches WKWebView */}
            <filter id="leafWorldSoft" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.25" />
            </filter>
          </defs>
          <g filter="url(#leafWorldSoft)">
            {/* translucent body — the luminous backdrop reads through it: backlit */}
            <path d={shape} fill="var(--leaf)" fillOpacity="0.6" />
            {VEINS.map((v, i) => (
              <path
                key={i}
                d={v.d}
                fill="none"
                stroke="var(--vein)"
                strokeWidth={v.w}
                strokeLinecap="round"
                opacity={(v.o * 0.7).toFixed(3)}
              />
            ))}
          </g>
        </svg>
      </div>
      <div className={styles.glow} />
      <div className={styles.thought}>
        <p>{row.thought}</p>
      </div>
    </div>
  )
}
