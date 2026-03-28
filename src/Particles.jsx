import { useEffect, useRef } from 'react'

const CONFIGS = {
  rain: {
    count: 35,
    init: (W, H) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: 10 + Math.random() * 8,
      speed: 6 + Math.random() * 4,
      angle: 0.2,
      width: 0.5 + Math.random() * 1.0,
      alpha: 0.08 + Math.random() * 0.07,
    }),
    draw(cx, p, W, H) {
      // tapered ink stroke — thicker at top, thinner at bottom
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
      if (p.y > H) { p.y = -p.len; p.x = Math.random() * W }
    },
  },
  storm: {
    count: 45,
    init: (W, H) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: 14 + Math.random() * 12,
      speed: 8 + Math.random() * 6,
      angle: 0.35,
      width: 0.6 + Math.random() * 1.2,
      alpha: 0.12 + Math.random() * 0.13,
      isSplash: Math.random() > 0.9,
      splashLife: 0,
    }),
    draw(cx, p, W, H) {
      if (p.isSplash) {
        // ink splat that fades out
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
      // longer, darker, more angled rain
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
      if (p.y > H) { p.y = -p.len; p.x = Math.random() * W }
    },
  },
  snow: {
    count: 20,
    init: (W, H) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 2,
      blur: 0.5 + Math.random() * 0.5,
      speed: 0.4 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
      alpha: 0.06 + Math.random() * 0.06,
    }),
    draw(cx, p, W, H) {
      p.wobble += 0.02
      cx.save()
      cx.filter = `blur(${p.blur}px)`
      cx.beginPath()
      cx.arc(p.x + Math.sin(p.wobble) * 1.5, p.y, p.r, 0, Math.PI * 2)
      cx.fillStyle = `rgba(80, 85, 95, ${p.alpha})`
      cx.fill()
      cx.restore()
      p.y += p.speed
      p.x += p.drift
      if (p.y > H) { p.y = -4; p.x = Math.random() * W }
    },
  },
  fog: {
    count: 6,
    init: (W, H) => ({
      x: Math.random() * W,
      y: 40 + Math.random() * (H * 0.7),
      w: 120 + Math.random() * 180,
      h: 30 + Math.random() * 40,
      speed: 0.15 + Math.random() * 0.15,
      alpha: 0.02 + Math.random() * 0.02,
    }),
    draw(cx, p, W, H) {
      cx.beginPath()
      cx.ellipse(p.x, p.y, p.w, p.h, 0, 0, Math.PI * 2)
      cx.fillStyle = `rgba(60, 55, 50, ${p.alpha})`
      cx.fill()
      p.x += p.speed
      if (p.x - p.w > W) p.x = -p.w
    },
  },
}

export function Particles({ type, W, H }) {
  const canvasRef = useRef()
  const frameRef = useRef()

  useEffect(() => {
    if (!type || type === 'none') return
    const cfg = CONFIGS[type]
    if (!cfg) return

    const cv = canvasRef.current
    const cx = cv.getContext('2d')
    const particles = Array.from({ length: cfg.count }, () => cfg.init(W, H))

    function tick() {
      cx.clearRect(0, 0, W, H)
      particles.forEach(p => cfg.draw(cx, p, W, H))
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [type, W, H])

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
