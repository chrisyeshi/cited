export default {
  makeRatioCurve (start, end, ratio = 0.5) {
    return `M ${start.x} ${start.y} C ${interpolate(start.x, end.x, ratio)} ${start.y} ${interpolate(end.x, start.x, ratio)} ${end.y} ${end.x} ${end.y}`
  },

  makeFixedCurve (start, end, deltaX) {
    const signX = (end.x - start.x) / Math.abs(end.x - start.x)
    return `M ${start.x} ${start.y} C ${start.x + deltaX * signX} ${start.y} ${end.x - deltaX * signX} ${end.y} ${end.x} ${end.y}`
  },

  makeElevatedCurve (start, end, deltaX, deltaY) {
    const signX = (end.x - start.x) / Math.abs(end.x - start.x) || 1
    const minY = Math.min(start.y, end.y)
    const startElevated =
      { x: start.x + 2 * deltaX * signX, y: minY - deltaY }
    const startCtrl = { x: start.x + deltaX * signX, y: start.y }
    const startElevatedCtrl =
      { x: startElevated.x - deltaX * signX, y: startElevated.y }
    const endElevated = { x: end.x - 2 * deltaX * signX, y: minY - deltaY }
    const endElevatedCtrl =
      { x: endElevated.x + deltaX * signX, y: endElevated.y }
    const endCtrl = { x: end.x - deltaX * signX, y: end.y }
    return `M ${start.x} ${start.y}` +
      ` C ${startCtrl.x} ${startCtrl.y} ${startElevatedCtrl.x} ${startElevatedCtrl.y} ${startElevated.x} ${startElevated.y}` +
      ` L ${endElevated.x} ${endElevated.y}` +
      ` C ${endElevatedCtrl.x} ${endElevatedCtrl.y} ${endCtrl.x} ${endCtrl.y} ${end.x} ${end.y}`
  },

  makeLine (a, b) {
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
  }
}

function interpolate (beg, end, ratio) {
  return ratio * (end - beg) + beg
}
