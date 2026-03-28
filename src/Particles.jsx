import { useEffect, useRef } from 'react'

function segBBox(s) {
  return {
    minX: Math.min(s.x1, s.x2) - 2,
    maxX: Math.max(s.x1, s.x2) + 2,
    minY: Math.min(s.y1, s.y2) - 2,
    maxY: Math.max(s.y1, s.y2) + 2,
  }
}

function hitsSegment(px, py, segs) {
  for (let i = 0; i < segs.length; i++) {
    const b = segBBox(segs[i])
    if (px >= b.minX && px <= b.maxX && py >= b.minY && py <= b.maxY) {
      return segs[i]
    }
  }
  return null
}

const CONFIGS = {
  rain: {
    backCount: 28,
    frontCount: 10,
    init: (W, H, isFront) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: isFront ? 16 + Math.random() * 10 : 10 + Math.random() * 8,
      speed: isFront ? 4 + Math.random() * 3 : 6 + Math.random() * 4,
      angle: 0.2,
      width: isFront ? 1.0 + Math.random() * 1.5 : 0.5 + Math.random() * 1.0,
      alpha: isFront ? 0.06 + Math.random() * 0.05 : 0.08 + Math.random() * 0.07,
      splash: null,
    }),
    draw(cx, p, W, H, isFront, segs) {
      // splash effect
      if (p.splash) {
        p.splash.life += 0.04
        if (p.splash.life > 1) {
          p.splash = null
        } else {
          const a = 0.12 * (1 - p.splash.life)
          cx.beginPath()
          cx.ellipse(p.splash.x, p.splash.y, 2 + p.splash.life * 3, 1 + p.splash.life * 1.5, 0, 0, Math.PI * 2)
          cx.fillStyle = `rgba(42, 38, 34, ${a.toFixed(3)})`
          cx.fill()
          // drip
          const dripY = p.splash.y + p.splash.life * 8
          cx.beginPath()
          cx.moveTo(p.splash.x, p.splash.y)
          cx.lineTo(p.splash.x + 0.3, dripY)
          cx.strokeStyle = `rgba(42, 38, 34, ${(a * 0.5).toFixed(3)})`
          cx.lineWidth = 0.4
          cx.stroke()
        }
      }

      const ex = p.x + p.angle * p.len
      const ey = p.y + p.len
      cx.beginPath()
      cx.moveTo(p.x - p.width * 0.5, p.y)
      cx.lineTo(p.x + p.width * 0.5, p.y)
      cx.lineTo(ex, ey)
      cx.closePath()
      cx.fillStyle = `rgba(60, 55, 50, ${p.alpha})`
      cx.fill()
      p.x += p.angle * p.speed
      p.y += p.speed

      // tree interaction: splash on branch hit
      if (segs && !isFront) {
        const hit = hitsSegment(p.x, p.y, segs)
        if (hit) {
          p.splash = { x: p.x, y: p.y, life: 0 }
          p.y = -p.len
          p.x = Math.random() * W
          return
        }
      }

      if (p.y > H) { p.y = -p.len; p.x = Math.random() * W }
    },
  },
  storm: {
    backCount: 35,
    frontCount: 14,
    init: (W, H, isFront) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: isFront ? 20 + Math.random() * 14 : 14 + Math.random() * 12,
      speed: isFront ? 6 + Math.random() * 4 : 8 + Math.random() * 6,
      angle: 0.35,
      width: isFront ? 1.2 + Math.random() * 1.8 : 0.6 + Math.random() * 1.2,
      alpha: isFront ? 0.08 + Math.random() * 0.08 : 0.12 + Math.random() * 0.13,
      isSplash: !isFront && Math.random() > 0.9,
      splashLife: 0,
      splash: null,
    }),
    draw(cx, p, W, H, isFront, segs) {
      if (p.isSplash) {
        p.splashLife += 0.02
        if (p.splashLife > 1) {
          p.splashLife = 0
          p.x = Math.random() * W
          p.y = H * 0.7 + Math.random() * H * 0.3
        }
        const alpha = 0.15 * (1 - p.splashLife)
        cx.beginPath()
        cx.ellipse(p.x, p.y, 3 + p.splashLife * 4, 1.5 + p.splashLife * 2, 0, 0, Math.PI * 2)
        cx.fillStyle = `rgba(40, 35, 30, ${alpha.toFixed(3)})`
        cx.fill()
        return
      }

      // splash on branch
      if (p.splash) {
        p.splash.life += 0.04
        if (p.splash.life > 1) {
          p.splash = null
        } else {
          const a = 0.15 * (1 - p.splash.life)
          cx.beginPath()
          cx.ellipse(p.splash.x, p.splash.y, 2.5 + p.splash.life * 4, 1.2 + p.splash.life * 2, 0, 0, Math.PI * 2)
          cx.fillStyle = `rgba(40, 35, 30, ${a.toFixed(3)})`
          cx.fill()
        }
      }

      const ex = p.x + p.angle * p.len
      const ey = p.y + p.len
      cx.beginPath()
      cx.moveTo(p.x - p.width * 0.5, p.y)
      cx.lineTo(p.x + p.width * 0.5, p.y)
      cx.lineTo(ex, ey)
      cx.closePath()
      cx.fillStyle = `rgba(40, 35, 30, ${p.alpha})`
      cx.fill()
      p.x += p.angle * p.speed
      p.y += p.speed

      if (segs && !isFront) {
        const hit = hitsSegment(p.x, p.y, segs)
        if (hit) {
          p.splash = { x: p.x, y: p.y, life: 0 }
          p.y = -p.len
          p.x = Math.random() * W
          return
        }
      }

      if (p.y > H) { p.y = -p.len; p.x = Math.random() * W }
    },
  },
  snow: {
    backCount: 16,
    frontCount: 6,
    init: (W, H, isFront) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: isFront ? 2 + Math.random() * 3 : 1 + Math.random() * 2,
      blur: isFront ? 1.0 + Math.random() * 1.0 : 0.5 + Math.random() * 0.5,
      speed: isFront ? 0.3 + Math.random() * 0.4 : 0.4 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      alpha: isFront ? 0.04 + Math.random() * 0.04 : 0.06 + Math.random() * 0.06,
      settling: false,
      settleTimer: 0,
    }),
    draw(cx, p, W, H, isFront, segs, tips) {
      p.wobble += 0.02

      // settling on branch tips
      if (p.settling) {
        p.settleTimer += 0.008
        if (p.settleTimer > 1) {
          p.settling = false
          p.settleTimer = 0
          p.y = -4
          p.x = Math.random() * W
          p.r = isFront ? 2 + Math.random() * 3 : 1 + Math.random() * 2
          return
        }
        const fadeAlpha = p.alpha * (1 - p.settleTimer)
        const shrinkR = p.r * (1 - p.settleTimer * 0.6)
        cx.save()
        cx.filter = `blur(${p.blur}px)`
        cx.beginPath()
        cx.arc(p.x, p.y, shrinkR, 0, Math.PI * 2)
        cx.fillStyle = `rgba(80, 85, 95, ${fadeAlpha.toFixed(3)})`
        cx.fill()
        cx.restore()
        return
      }

      cx.save()
      cx.filter = `blur(${p.blur}px)`
      cx.beginPath()
      cx.arc(p.x + Math.sin(p.wobble) * 1.5, p.y, p.r, 0, Math.PI * 2)
      cx.fillStyle = `rgba(80, 85, 95, ${p.alpha})`
      cx.fill()
      cx.restore()
      p.y += p.speed
      p.x += p.drift

      // settle near branch tips
      if (tips && !isFront && p.y > 0) {
        for (let i = 0; i < tips.length; i++) {
          const dx = p.x - tips[i].x
          const dy = p.y - tips[i].y
          if (dx * dx + dy * dy < 100) {
            p.settling = true
            p.settleTimer = 0
            p.x = tips[i].x + (Math.random() - 0.5) * 4
            p.y = tips[i].y
            return
          }
        }
      }

      if (p.y > H) { p.y = -4; p.x = Math.random() * W }
    },
  },
  fog: {
    backCount: 4,
    frontCount: 3,
    init: (W, H, isFront) => ({
      x: Math.random() * W,
      y: 40 + Math.random() * (H * 0.7),
      w: isFront ? 160 + Math.random() * 220 : 120 + Math.random() * 180,
      h: isFront ? 40 + Math.random() * 50 : 30 + Math.random() * 40,
      speed: isFront ? 0.10 + Math.random() * 0.10 : 0.15 + Math.random() * 0.15,
      alpha: isFront ? 0.015 + Math.random() * 0.015 : 0.02 + Math.random() * 0.02,
      baseW: 0,
    }),
    draw(cx, p, W, H, isFront, segs) {
      if (!p.baseW) p.baseW = p.w

      // fog wraps around trunk area
      const trunkX = W / 2
      const distToTrunk = Math.abs(p.x - trunkX)
      if (distToTrunk < p.baseW * 0.6) {
        const wrapFactor = 1 - distToTrunk / (p.baseW * 0.6)
        p.w = p.baseW * (1 + wrapFactor * 0.3)
        p.h = p.h * (1 - wrapFactor * 0.15)
      } else {
        p.w = p.baseW
      }

      cx.beginPath()
      cx.ellipse(p.x, p.y, p.w, p.h, 0, 0, Math.PI * 2)
      cx.fillStyle = `rgba(60, 55, 50, ${p.alpha})`
      cx.fill()
      p.x += p.speed
      if (p.x - p.w > W) p.x = -p.w
    },
  },
}

export function Particles({ type, layer, W, H, segs, tips }) {
  const canvasRef = useRef()
  const frameRef = useRef()
  const isFront = layer === 'front'

  useEffect(() => {
    if (!type || type === 'none') return
    const cfg = CONFIGS[type]
    if (!cfg) return

    const cv = canvasRef.current
    const cx = cv.getContext('2d')
    const count = isFront ? cfg.frontCount : cfg.backCount
    const particles = Array.from({ length: count }, () => cfg.init(W, H, isFront))

    function tick() {
      cx.clearRect(0, 0, W, H)
      if (isFront) cx.filter = 'blur(0.8px)'
      particles.forEach(p => cfg.draw(cx, p, W, H, isFront, segs, tips))
      if (isFront) cx.filter = 'none'
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [type, W, H, isFront, segs, tips])

  if (!type || type === 'none') return null

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
