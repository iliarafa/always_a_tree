import { useMemo } from 'react'

const W = 390
const H = 680

function makeRng(seed) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

function buildTree(rng) {
  const segs = [], tips = []
  function branch(x, y, a, len, d) {
    if (!d) { tips.push({ x, y, angle: a }); return }
    const ex = x + Math.cos(a) * len
    const ey = y + Math.sin(a) * len
    segs.push({ x1: x, y1: y, x2: ex, y2: ey, d })

    // symmetric core spread with slight organic nudge
    const sp = 0.25 + rng() * 0.10
    const nudge = (rng() - 0.5) * 0.06

    // vary length ratio per side independently (B-style unpredictability)
    const lrL = 0.58 + rng() * 0.12
    const lrR = 0.58 + rng() * 0.12

    branch(ex, ey, a - sp + nudge, len * lrL, d - 1)
    branch(ex, ey, a + sp + nudge, len * lrR, d - 1)

    // C-style windswept outlier: occasional reaching branch
    if (d > 3 && d < 7 && rng() > 0.75) {
      const windDir = rng() > 0.5 ? 1 : -1
      const windAngle = a + windDir * (0.35 + rng() * 0.25)
      branch(ex, ey, windAngle, len * lrL * 0.9, d - 2)
    }
  }
  branch(W / 2, H, -Math.PI / 2, 130, 8)
  return { segs, tips }
}

export function useTree() {
  return useMemo(() => {
    const rng = makeRng(31415)
    return { ...buildTree(rng), W, H }
  }, [])
}
