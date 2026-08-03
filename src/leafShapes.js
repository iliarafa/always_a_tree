// static leaf geometry shared by Leaf (tiny, on the tree) and LeafWorld (fullscreen)

// elongated pointed leaf shapes (stem at bottom center 7,26 — tip at top 7,0)
export const LEAF_SHAPES = [
  // standard — symmetric, gentle curves
  'M7,26 C2,21 0,13 1,7 C2,2.5 4.5,0 7,0 C9.5,0 12,2.5 13,7 C14,13 12,21 7,26Z',
  // asymmetric — fuller left side
  'M7,26 C1,21 -0.5,14 1,8 C2,3 4.5,0 7,0 C10,0 13,3.5 13,8 C13.5,15 11,21 7,26Z',
  // narrow — more elongated
  'M7,26 C3,21 1.5,14 2,7 C2.5,2.5 5,0 7,0 C9,0 11.5,2.5 12,7 C12.5,14 11,21 7,26Z',
  // wide — rounder, broader
  'M7,26 C1,20 -0.5,12 1,7 C2,2 5,0 7,0 C9,0 12,2 13,7 C14.5,12 13,20 7,26Z',
]

// vein strokes in leaf viewBox units (14×26) — { d: path, w: strokeWidth, o: opacity }
export const VEINS = [
  // central vein (midrib) — slight curve
  { d: 'M7,24 Q6.5,13 7,1', w: 0.6, o: 0.3 },
  // side veins — curved lines branching from midrib
  { d: 'M7,20 Q4,17 2.5,16', w: 0.35, o: 0.2 },
  { d: 'M7,20 Q10,17 11.5,16', w: 0.35, o: 0.2 },
  { d: 'M7,15 Q4,12.5 2,12', w: 0.35, o: 0.2 },
  { d: 'M7,15 Q10,12.5 12,12', w: 0.35, o: 0.2 },
  { d: 'M7,10 Q4.5,8 3,7.5', w: 0.35, o: 0.2 },
  { d: 'M7,10 Q9.5,8 11,7.5', w: 0.35, o: 0.2 },
  { d: 'M7,6 Q5.5,4.5 4.5,4.5', w: 0.3, o: 0.15 },
  { d: 'M7,6 Q8.5,4.5 9.5,4.5', w: 0.3, o: 0.15 },
]
