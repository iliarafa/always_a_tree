import { LEAF_SHAPES, VEINS } from './leafShapes'
import styles from './Leaf.module.css'

function seededRng(id) {
  let s = 0
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) | 0
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  return { r, seed: s }
}

export function Leaf({ row, tipX, tipY, tipAngle, W, H, isNew, palette, swayMultiplier = 1, onOpen, hidden }) {
  const { r, seed } = seededRng(row.id)
  const ox = (r() - .5) * 6
  const oy = r() * 4

  const leafShape = LEAF_SHAPES[Math.abs(seed) % LEAF_SHAPES.length]
  const color = palette[Math.abs(seed) % palette.length]
  const animIdx = Math.abs(seed) % 4
  const baseDur = 3.5 + r() * 2
  const dur = `${(baseDur * swayMultiplier).toFixed(2)}s`
  const del = isNew ? '0s' : `${(r() * -5).toFixed(1)}s`

  const left = `${((tipX + ox) / W * 100).toFixed(2)}%`
  const top  = `${((tipY + oy) / H * 100).toFixed(2)}%`

  // subtle shape variation — same base, slightly different proportions
  const scaleX = (0.85 + r() * 0.30).toFixed(2)
  const scaleY = (0.90 + r() * 0.20).toFixed(2)

  // dangle rotation from branch angle
  const baseRotDeg = tipAngle != null
    ? (tipAngle * 180 / Math.PI + 90 + (r() - 0.5) * 20).toFixed(1)
    : ((r() - 0.5) * 20).toFixed(1)

  // ink-wash variation per leaf
  const blurAmount = (0.3 + r() * 0.5).toFixed(2)
  const leafOpacity = (0.4 + r() * 0.3).toFixed(2)
  const turbSeed = Math.abs(seed) % 100
  const filterId = `inkWash-${row.id}`

  const animName = isNew
    ? `inkBloom, sway${animIdx + 1}`
    : `sway${animIdx + 1}`
  const animDur = isNew ? `0.6s, ${dur}` : dur
  const animDelay = isNew ? `0s, 0.6s` : del
  const animIter = isNew ? `1, infinite` : 'infinite'
  const animFill = isNew ? `forwards, none` : 'none'

  function handleOpen(e) {
    e.stopPropagation()
    if (!row.thought) return
    const el = e.currentTarget
    // a neighbor's invisible ::after tap halo can sit above this leaf's
    // painted body — for real pointer taps, prefer the leaf actually under
    // the point (forwarded .click() is untrusted, so it can't loop)
    const ne = e.nativeEvent
    if (ne?.isTrusted && typeof ne.clientX === 'number') {
      const hitPath = document.elementsFromPoint(ne.clientX, ne.clientY)
        .find(n => n instanceof SVGPathElement)
      const owner = hitPath && hitPath.closest(`.${styles.leaf}`)
      if (owner && owner !== el) { owner.click(); return }
    }
    // single read pass, before any state change
    const rect = el.getBoundingClientRect()
    const swayRot = parseFloat(getComputedStyle(el).rotate) || 0
    onOpen({ row, rect, swayRot, shape: leafShape, color, baseRotDeg: Number(baseRotDeg) })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleOpen(e)
    }
  }

  return (
    <div
      className={styles.leaf}
      role="button"
      tabIndex={0}
      aria-label="read a thought"
      style={{
        left, top,
        animationName: animName,
        animationDuration: animDur,
        animationDelay: animDelay,
        animationIterationCount: animIter,
        animationFillMode: animFill,
        animationTimingFunction: 'ease-in-out',
        ...(hidden ? { visibility: 'hidden', animationPlayState: 'paused' } : null),
      }}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
    >
      <svg width="14" height="26" viewBox="0 0 14 26" style={{ overflow: 'visible' }}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed={turbSeed} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
            <feGaussianBlur stdDeviation={blurAmount} />
          </filter>
        </defs>
        <g
          filter={`url(#${filterId})`}
          opacity={leafOpacity}
          transform={`rotate(${baseRotDeg}, 7, 13) scale(${scaleX}, ${scaleY})`}
          transform-origin="7 13"
        >
          {/* leaf body */}
          <path d={leafShape} fill={color.f} />
          {/* thin sketched outline */}
          <path d={leafShape} fill="none" stroke={color.v} strokeWidth=".5" opacity=".35" />
          {/* veins — midrib + curved side branches */}
          {VEINS.map((v, i) => (
            <path key={i} d={v.d} fill="none" stroke={color.v} strokeWidth={v.w} opacity={v.o} />
          ))}
        </g>
      </svg>
    </div>
  )
}
