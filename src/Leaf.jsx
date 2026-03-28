import { useState } from 'react'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import styles from './Leaf.module.css'

async function haptic(style = ImpactStyle.Light) {
  try { await Haptics.impact({ style }) } catch (_) {}
}

function seededRng(id) {
  let s = 0
  for (let i = 0; i < id.length; i++) s = (s * 31 + id.charCodeAt(i)) | 0
  const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  return { r, seed: s }
}

export function Leaf({ row, sessionId, tipX, tipY, W, H, isNew, palette, swayMultiplier = 1 }) {
  const [tooltip, setTooltip] = useState(false)
  const mine = row.session_id === sessionId

  const { r, seed } = seededRng(row.id)
  const ox = (r() - .5) * 22
  const oy = (r() - .5) * 16

  const color = palette[Math.abs(seed) % palette.length]
  const animIdx = Math.abs(seed) % 4
  const baseDur = 3.5 + r() * 2 // slower base: 3.5–5.5s
  const dur = `${(baseDur * swayMultiplier).toFixed(2)}s`
  const del = isNew ? '0s' : `${(r() * -5).toFixed(1)}s`

  const left = `${((tipX + ox) / W * 100).toFixed(2)}%`
  const top  = `${((tipY + oy) / H * 100).toFixed(2)}%`

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

  function handleClick(e) {
    e.stopPropagation()
    if (mine && row.thought) {
      haptic(ImpactStyle.Light)
      setTooltip(v => !v)
    }
  }

  return (
    <div
      className={`${styles.leaf} ${mine ? styles.mine : ''}`}
      style={{
        left, top,
        animationName: animName,
        animationDuration: animDur,
        animationDelay: animDelay,
        animationIterationCount: animIter,
        animationFillMode: animFill,
        animationTimingFunction: 'ease-in-out',
      }}
      onClick={handleClick}
    >
      <svg width="16" height="22" viewBox="0 0 16 22" style={{ overflow: 'visible' }}>
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed={turbSeed} result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
            <feGaussianBlur stdDeviation={blurAmount} />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`} opacity={leafOpacity}>
          <path
            d="M8,21C3,17,1,12,1,7C1,3,4,0,8,0C12,0,15,3,15,7C15,12,13,17,8,21Z"
            fill={color.f}
          />
          <line x1="8" y1="21" x2="8" y2="2" stroke={color.v} strokeWidth=".8" opacity=".4" />
        </g>
      </svg>
      {mine && tooltip && row.thought && (
        <div className={styles.tooltip} onClick={e => e.stopPropagation()}>
          {row.thought}
        </div>
      )}
    </div>
  )
}
