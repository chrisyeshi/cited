export default {
  makeRatioCurve (start, end, ratio = 0.5) {
    return `M${start.x} ${start.y} C ${interpolate(start.x, end.x, ratio)} ${start.y}, ${interpolate(end.x, start.x, ratio)} ${end.y}, ${end.x} ${end.y}`
  },

  makeFixedCurve (start, end, deltaX) {
    const signX = (end.x - start.x) / Math.abs(end.x - start.x)
    return `M${start.x} ${start.y} C ${start.x + deltaX * signX} ${start.y}, ${end.x - deltaX * signX} ${end.y}, ${end.x} ${end.y}`
  },

  makeLine (a, b) {
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
  }
}

function interpolate (beg, end, ratio) {
  return ratio * (end - beg) + beg
}
