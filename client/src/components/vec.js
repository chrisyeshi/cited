export default class Vec {
  constructor (x = 0, y = 0) {
    this.x = x
    this.y = y
  }

  get length () {
    return Math.sqrt(this.length2)
  }

  get length2 () {
    return this.x * this.x + this.y * this.y
  }

  static distance (aVec, bVec) {
    return Vec.minus(bVec, aVec).length
  }

  static distance2 (aVec, bVec) {
    return Vec.minus(bVec, aVec).length2
  }

  static equal (aVec, bVec, epsilon) {
    return equal(aVec.x, bVec.x, epsilon) && equal(aVec.y, bVec.y, epsilon)
  }

  static interpolate (aVec, bVec, ratio) {
    return new Vec(
      interpolate(aVec.x, bVec.x, ratio),
      interpolate(aVec.y, bVec.y, ratio))
  }

  static mid (aVec, bVec) {
    return this.interpolate(aVec, bVec, 0.5)
  }

  static minus (aVec, bVec) {
    return new Vec(aVec.x - bVec.x, aVec.y - bVec.y)
  }

  static plus (aVec, bVec) {
    return new Vec(aVec.x + bVec.x, aVec.y + bVec.y)
  }

  static times (vec, constant) {
    return new Vec(vec.x * constant, vec.y * constant)
  }

  static dot (aVec, bVec) {
    return aVec.x * bVec.x + aVec.y * bVec.y
  }
}

function equal (a, b, epsilon) {
  return Math.abs(a - b) <= epsilon
}

function interpolate (beg, end, ratio) {
  return ratio * (end - beg) + beg
}
