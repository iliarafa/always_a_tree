import { useEffect, useRef } from 'react'

const CONFIGS = {
  rain: {
    count: 80,
    color: 'rgba(150,190,210,0.25)',
    init: (W, H) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: 10 + Math.random() * 8,
      speed: 6 + Math.random() * 4,
      angle: 0.2,
    }),
    draw(cx, p, W, H) {
      cx.beginPath()
      cx.moveTo(p.x, p.y)
      cx.lineTo(p.x + p.angle * p.len, p.y + p.len)
      cx.stroke()
      p.x += p.angle * p.speed
      p.y += p.speed
      if (p.y > H) { p.y = -p.len; p.x = Math.random() * W }
    },
  },
  snow: {
    count: 40,
    color: 'rgba(220,230,240,0.35)',
    init: (W, H) => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 2,
      speed: 0.4 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * Math.PI * 2,
    }),
    draw(cx, p, W, H) {
      p.wobble += 0.02
      cx.beginPath()
      cx.arc(p.x + Math.sin(p.wobble) * 1.5, p.y, p.r, 0, Math.PI * 2)
      cx.fill()
      p.y += p.speed
      p.x += p.drift
      if (p.y > H) { p.y = -4; p.x = Math.random() * W }
    },
  },
  fog: {
    count: 6,
    color: 'rgba(180,190,180,0.04)',
    init: (W, H) => ({
      x: Math.random() * W,
      y: 40 + Math.random() * (H * 0.7),
      w: 120 + Math.random() * 180,
      h: 30 + Math.random() * 40,
      speed: 0.15 + Math.random() * 0.15,
    }),
    draw(cx, p, W, H) {
      cx.beginPath()
      cx.ellipse(p.x, p.y, p.w, p.h, 0, 0, Math.PI * 2)
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
      cx.strokeStyle = cfg.color
      cx.fillStyle = cfg.color
      cx.lineWidth = type === 'rain' ? 1 : undefined
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
