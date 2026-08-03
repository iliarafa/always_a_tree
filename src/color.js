// linear mix between two '#rrggbb' colors, t in [0,1] — always returns hex:
// palette entries travel through LeafWorld's payload and are parsed via slice(1)
export function mixHex(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16)
  const b = parseInt(hexB.slice(1), 16)
  const ch = sh => {
    const v = Math.round(((a >> sh) & 255) + (((b >> sh) & 255) - ((a >> sh) & 255)) * t)
    return v.toString(16).padStart(2, '0')
  }
  return `#${ch(16)}${ch(8)}${ch(0)}`
}
