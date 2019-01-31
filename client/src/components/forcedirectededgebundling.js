import _ from 'lodash'
import Vec from './vec.js'

export default class {
  constructor (callback) {
    this.nSegmentsPerEdge = 8
    this.springConstant = 10000
    this.electroConstant = 1
    this.forceConstant = 0.001
    this.forceThreshold = 100
    this.compatibleThreshold = 0.1
    this.interval = 100
    this.maxIteration = Infinity
    this.edges = [ new Edge() ]
    this.isSimulating = false
    this.iItr = 0
    this.callback = callback
  }

  setCompatibleThreshold (value) {
    this.compatibleThreshold = value
    this.compatibleEdgeLists =
      getCompatibleEdgeLists(this.edges, this.compatibleThreshold)
    this.startSimulation()
  }

  setElectroConstant (value) {
    this.electroConstant = value
    this.startSimulation()
  }

  setForceConstant (value) {
    this.forceConstant = value
    this.startSimulation()
  }

  setInterval (value) {
    this.interval = value
    this.startSimulation()
  }

  setNSegmentsPerEdge (value) {
    this.nSegmentsPerEdge = value
    this.updateEdgePts()
  }

  setSpringConstant (value) {
    this.springConstant = value
    this.startSimulation()
  }

  simulate () {
    const forces =
      computeForces(
        this.edgePts, this.compatibleEdgeLists, this.springConstant,
        this.electroConstant)
    const maxForce = getMaxForce(forces) || 0
    if (maxForce < this.forceThreshold || ++this.iItr > this.maxIteration) {
      this.isSimulating = false
      return
    }
    this.edgePts = nextEdgePts(this.edgePts, forces, this.forceConstant)
    this.callback(this.edgePts)
    setTimeout(_.bind(this.simulate, this), this.interval)
  }

  startSimulation () {
    if (this.isSimulating) {
      this.iItr = 0
      return
    }
    this.isSimulating = true
    this.simulate()
  }

  updateEdgePts () {
    this.compatibleEdgeLists =
      getCompatibleEdgeLists(this.edges, this.compatibleThreshold)
    const breakEdge =
      _.bind(breakEdgeIntoSegments, null, this.nSegmentsPerEdge)
    this.edgePts = _.map(this.edges, breakEdge)
    this.callback(this.edgePts)
    this.startSimulation()
  }

  get nPtsPerEdge () {
    return this.nSegmentsPerEdge + 1
  }

  set edgeEndPts (arr) {
    this.edges = _.map(arr, ({ beg, end }) => new Edge(beg, end))
    this.updateEdgePts()
  }
}

class Compatibility {
  static angle (aEdge, bEdge) {
    const aVec = Vec.minus(aEdge.end, aEdge.beg)
    const bVec = Vec.minus(bEdge.end, bEdge.beg)
    return Math.abs(Vec.dot(aVec, bVec) / (aVec.length * bVec.length))
  }

  static position (aEdge, bEdge) {
    const avgLength = (aEdge.length + bEdge.length) / 2
    return avgLength / (avgLength + Vec.distance(aEdge.midPt, bEdge.midPt))
  }

  static scale (aEdge, bEdge) {
    const avgLength = (aEdge.length + bEdge.length) / 2
    return 2 / (avgLength / Math.min(aEdge.length, bEdge.length) + Math.max(aEdge.length, bEdge.length) / avgLength)
  }

  static visibility (aEdge, bEdge) {
    const projectPointOnLine = (pt, edge) => {
      const { beg, end } = edge
      const ratio = ((beg.y - pt.y) * (beg.y - end.y) - (beg.x - pt.x) * (end.x - beg.x)) / (edge.length2)
      return Vec.plus(beg, Vec.times(Vec.minus(end, beg), ratio))
    }
    const edgeVisibility = (aEdge, bEdge) => {
      const I0 = projectPointOnLine(bEdge.beg, aEdge)
      const I1 = projectPointOnLine(bEdge.end, aEdge)
      const IMid = Vec.mid(I0, I1)
      const PMid = aEdge.midPt
      return Math.max(
        0, 1 - 2 * Vec.distance(PMid, IMid) / Vec.distance(I0, I1))
    }
    return Math.min(edgeVisibility(aEdge, bEdge), edgeVisibility(bEdge, aEdge))
  }

  static endPt (aEdge, bEdge) {
    const epsilon = 0.001
    const isSameBeg = Vec.equal(aEdge.beg, bEdge.beg, epsilon)
    const isSameEnd = Vec.equal(aEdge.end, bEdge.end, epsilon)
    return isSameBeg || isSameEnd ? 1 : 0
  }

  static score (aEdge, bEdge) {
    const a = this.angle(aEdge, bEdge)
    const s = this.scale(aEdge, bEdge)
    const p = this.position(aEdge, bEdge)
    const v = this.visibility(aEdge, bEdge)
    const e = this.endPt(aEdge, bEdge)
    return a * s * p * v * e
  }
}

class Edge {
  constructor (beg = new Vec(), end = new Vec()) {
    this.beg = beg
    this.end = end
  }

  get length () {
    return Vec.distance(this.beg, this.end)
  }

  get length2 () {
    return Vec.distance2(this.beg, this.end)
  }

  get midPt () {
    return Vec.times(Vec.plus(this.beg, this.end), 0.5)
  }
}

function breakEdgeIntoSegments (nSegmentsPerEdge, { beg, end }) {
  const nPtsPerEdge = nSegmentsPerEdge + 1
  const pts = []
  pts[0] = new Vec(beg.x, beg.y)
  pts[nPtsPerEdge - 1] = new Vec(end.x, end.y)
  for (let iPt = 1; iPt < nPtsPerEdge - 1; ++iPt) {
    const ratio = (iPt) / (nPtsPerEdge - 1)
    pts[iPt] = Vec.interpolate(beg, end, ratio)
  }
  return pts
}

function computeElectroForce (thisPt, compatiblePts, electroConstant) {
  let electroForce = new Vec(0, 0)
  _.forEach(compatiblePts, thatPt => {
    const delta = Vec.minus(thatPt, thisPt)
    electroForce = Vec.plus(electroForce, delta)
  })
  return Vec.times(electroForce, electroConstant)
}

function computeForces (
  edgePts = [], compatibleEdgeLists, springConstant, electroConstant) {
  const nPtsPerEdge = edgePts ? edgePts[0] ? edgePts[0].length : 0 : 0
  const forces = []
  for (let iEdge = 0; iEdge < edgePts.length; ++iEdge) {
    const thisPts = edgePts[iEdge]
    forces[iEdge] = forces[iEdge] || []
    forces[iEdge][0] = { x: 0, y: 0 }
    forces[iEdge][nPtsPerEdge - 1] = { x: 0, y: 0 }
    for (let iPt = 1; iPt < nPtsPerEdge - 1; ++iPt) {
      const springForce =
        computeSpringForce(
          thisPts[iPt], thisPts[iPt - 1], thisPts[iPt + 1], _.first(thisPts),
          _.last(thisPts), springConstant)
      const thatEdgePts =
        _.map(compatibleEdgeLists[iEdge], jEdge => edgePts[jEdge])
      const compatiblePts = _.map(thatEdgePts, thatPts => thatPts[iPt])
      const electroForce = computeElectroForce(thisPts[iPt], compatiblePts, electroConstant)
      forces[iEdge][iPt] = Vec.plus(springForce, electroForce)
    }
  }
  return forces
}

function computeSpringForce (curr, prev, next, beg, end, springConstant) {
  const length = Vec.distance(beg, end)
  const localSpringConstant = springConstant / length
  const prevDelta = Vec.minus(prev, curr)
  const nextDelta = Vec.minus(next, curr)
  const springDelta = Vec.plus(prevDelta, nextDelta)
  return Vec.times(springDelta, localSpringConstant)
}

function getCompatibleEdgeLists (edgeEndPts, threshold = 0) {
  const indexLists = _.map(edgeEndPts, () => ([]))
  for (let iEdge = 0; iEdge < edgeEndPts.length; ++iEdge) {
    for (let jEdge = iEdge + 1; jEdge < edgeEndPts.length; ++jEdge) {
      const score = Compatibility.score(edgeEndPts[iEdge], edgeEndPts[jEdge])
      if (score >= threshold) {
        indexLists[iEdge].push(jEdge)
        indexLists[jEdge].push(iEdge)
      }
    }
  }
  return indexLists
}

function getMaxForce (forces) {
  return _.max(
    _.map(
      _.flatten(forces),
      force => _.max([ Math.abs(force.x), Math.abs(force.y) ])))
}

function nextEdgePts (edgePts, forces, forceConstant) {
  const nPtsPerEdge = edgePts ? edgePts[0] ? edgePts[0].length : 0 : 0
  let newEdgePts = []
  for (let iEdge = 0; iEdge < edgePts.length; ++iEdge) {
    newEdgePts[iEdge] = newEdgePts[iEdge] || []
    newEdgePts[iEdge][0] = edgePts[iEdge][0]
    newEdgePts[iEdge][nPtsPerEdge - 1] = edgePts[iEdge][nPtsPerEdge - 1]
    for (let iPt = 1; iPt < nPtsPerEdge - 1; ++iPt) {
      newEdgePts[iEdge][iPt] =
        Vec.plus(
          edgePts[iEdge][iPt], Vec.times(forces[iEdge][iPt], forceConstant))
    }
  }
  return newEdgePts
}
