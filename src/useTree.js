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
    if (!d) { tips.push({ x, y }); return }
    const ex = x + Math.cos(a) * len
    const ey = y + Math.sin(a) * len
    segs.push({ x1: x, y1: y, x2: ex, y2: ey, d })
    const sp = .27 + rng() * .09
    const lr = .65 + rng() * .06
    branch(ex, ey, a - sp, len * lr, d - 1)
    branch(ex, ey, a + sp, len * lr, d - 1)
    if (d > 3 && rng() > .52) branch(ex, ey, a + (rng() - .5) * .4, len * lr * .8, d - 2)
  }
  branch(W / 2, H, -Math.PI / 2, 110, 7)
  return { segs, tips }
}

export function useTree() {
  return useMemo(() => {
    const rng = makeRng(31415)
    return { ...buildTree(rng), W, H }
  }, [])
}
