<template>
  <v-content>
    <v-navigation-drawer app floating stateless clipped :width="drawerWidth"
      v-model="isDrawerOpen">
      <v-container>
        <div v-show="isDrawerEmpty">Drawer Empty</div>
      </v-container>
    </v-navigation-drawer>
    <div v-if="isGraphViewVisible" class="vis-container">
      <svg class="overlay-container" :style="overlayContainerStyle" :viewBox="`0 0 ${this.canvasWidth} ${this.canvasHeight}`">
        <path v-for="(props, key) in paths" :key="key" v-bind="props"></path>
      </svg>
      <div class="cards-container" :style="cardsContainerStyle">
        <!-- TODO: render different styles depend on the article type -->
        <div v-for="(node, index) in visGraph.nodes" :key="index"
          :style="getCardStyle(node)">
          <div :style="getCardSideStyle(node.inGraphReferences.length)"></div>
          <div class="py-1 px-2" :style="cardRowsContainerStyle">
            <div class="text-xs-center font-weight-bold card-row">
              {{ getLabelRowText(node) }}
            </div>
            <!-- TODO: add tooltip to show entire title -->
            <div class="text-xs-center text-truncate card-row">
              {{ node.article.data.title }}
            </div>
            <div class="text-xs-center card-row" style="display: flex;">
              <span class="text-truncate" style="display: inline-flex; flex: 1; justify-content: center;">
                <span class="text-truncate" style="white-space: nowrap">
                  {{ node.article.data.venue.name }}
                </span>
              </span>
              <span style="display: inline-flex; justify-content: center;">
                <span class="mx-2">-</span>
              </span>
              <span style="display: inline-flex; flex: 1; justify-content: center;">
                <span style="white-space: nowrap">
                  Cited by {{ node.article.nCitedBys }}
                </span>
              </span>
            </div>
          </div>
          <div :style="getCardSideStyle(node.inGraphCitedBys.length)"></div>
        </div>
      </div>
    </div>
    <v-layout v-if="isEmptyViewVisible" fill-height justify-center align-center>
      <v-dialog max-width="680" scrollable>
        <v-btn flat slot="activator">Add paper to see visualization</v-btn>
        <v-container style="background: white;">
          <pv-article-form></pv-article-form>
        </v-container>
      </v-dialog>
    </v-layout>
  </v-content>
</template>

<script>
import _ from 'lodash'
import PvArticleForm from './PvArticleForm.vue'
import Vec from './vec.js'
import { Graph } from './pvmodels.js'
import { interpolateBuPu as interpolateColor } from 'd3-scale-chromatic'

export default {
  name: 'PvVisView',
  components: { PvArticleForm },
  props: {
    graph: new Graph(),
    isDrawerOpen: false
  },
  data () {
    return {
      drawerWidth: '450',
      drawerState: 'empty',
      cardBorderRadius: 0.65,
      cardHeight: 5.2,
      cardHorizontalSpacing: 4,
      cardOpacity: 0.8,
      cardSideDarkness: 0.2,
      cardSideWidth: 0.5,
      cardVerticalSpacing: 0.8,
      cardWidth: 15,
      canvasPadding: { left: 2, top: 2, right: 2, bottom: 2 },
      fontSize: 12,
      pathWidth: 0.175,
      pathOpacity: 0.8,
      pathDarkness: 0.35,
      pathEndMinX: 0.5,
      verticalGapLaneSpacing: 0.4,
      verticalGapOrthogonalPathRadius: 0.5
    }
  },
  computed: {
    canvasHeight () {
      const nRows = this.gridConfig.nRow
      const paddings = this.canvasPadding.top + this.canvasPadding.bottom
      const spacing = (nRows - 1) * this.cardVerticalSpacing
      const prevHeight = nRows * this.cardHeight
      return paddings + spacing + prevHeight
    },
    canvasWidth () {
      const nColumns = this.maxReferenceLevel + 1
      return this.canvasPadding.left + nColumns * this.cardWidth + (nColumns - 1) * this.cardHorizontalSpacing + this.canvasPadding.right
    },
    cardRowsContainerStyle () {
      return {
        flexGrow: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: '10px',
        background: `rgba(255, 255, 255, ${this.cardOpacity})`
      }
    },
    cardsContainerStyle () {
      return {
        fontSize: this.fontSize + 'px',
        width: this.canvasWidth + 'em',
        height: this.canvasHeight + 'em'
      }
    },
    crossColumnPaths () {
      // TODO: bundle these paths
      const crossColumnLinks =
        _.filter(
          this.visGraph.links,
          link => link.citedBy.col - link.reference.col > 1)
      return _.map(crossColumnLinks, link => {
        const beg = this.getPathRefPt(link)
        const begProtrude = new Vec(beg.x + this.pathEndMinX, beg.y)
        const end = this.getPathCitedByPt(link)
        const endProtrude = new Vec(end.x - this.pathEndMinX, end.y)
        return {
          d: `M ${beg.x} ${beg.y} L ${begProtrude.x} ${begProtrude.y} C ${begProtrude.x + 4 * this.pathEndMinX} ${begProtrude.y} ${endProtrude.x - 4 * this.pathEndMinX} ${endProtrude.y} ${endProtrude.x} ${endProtrude.y} L ${end.x} ${end.y}`,
          fill: 'none',
          'stroke-width': this.pathWidth,
          stroke: this.getPathColor(link.weight),
          'stroke-opacity': this.pathOpacity
        }
      })
    },
    gridConfig () {
      const nRows = _.map(this.unsortedIndexGrid, column => column.length)
      const nRow = _.max(nRows)
      const nCol = this.unsortedIndexGrid.length
      return {
        nCol: nCol,
        nHorizontalGap: nRow - 1,
        nVerticalGap: nCol - 1,
        nRow: nRow,
        nRows: nRows
      }
    },
    isDrawerEmpty () { return this.drawerState === 'empty' },
    isEmptyViewVisible () { return this.graph.isEmpty },
    isGraphViewVisible () { return !this.graph.isEmpty },
    maxReferenceLevel () { return _.max(this.referenceLevels) },
    overlayContainerStyle () {
      return {
        fontSize: this.fontSize + 'px',
        width: this.canvasWidth + 'em',
        height: this.canvasHeight + 'em'
      }
    },
    paths () {
      return [
        ...this.verticalGapOrthogonalPaths,
        ...this.verticalGapHorizontalPaths,
        ...this.crossColumnPaths
      ]
    },
    referenceLevels () {
      return getNodeLevels(
        this.graph.nodes, 'inGraphReferences', 'inGraphCitedBys')
    },
    sortedIndexGrid () {
      return _.map(this.unsortedIndexGrid, unsortedIndexColumn => {
        return _.sortBy(unsortedIndexColumn, index => {
          const node = this.graph.nodes[index]
          return -node.inGraphCitedBys.length
        })
      })
    },
    sortedIndexColRows () {
      const colRows = []
      _.forEach(this.sortedIndexGrid, (sortedIndexColumn, iCol) => {
        _.forEach(sortedIndexColumn, (index, iRow) => {
          colRows[index] = { col: iCol, row: iRow }
        })
      })
      return colRows
    },
    unsortedIndexGrid () {
      const maxRefLevel = this.maxReferenceLevel
      const grid = _.map(new Array(maxRefLevel + 1), () => ([]))
      for (let index = 0; index < this.graph.nodes.length; ++index) {
        const columnIndex = this.referenceLevels[index]
        grid[columnIndex].push(index)
      }
      return grid
    },
    verticalGapHorizontalPaths () {
      const verticalGapLinks =
        _.filter(
          this.visGraph.links,
          link => link.citedBy.col - link.reference.col === 1)
      const verticalGapHorizontalLinks =
        _.filter(
          verticalGapLinks,
          link => link.citedBy.row === link.reference.row)
      return _.map(verticalGapHorizontalLinks, link => {
        const beg = this.getPathRefPt(link)
        const begProtrude = new Vec(beg.x + this.pathEndMinX, beg.y)
        const end = this.getPathCitedByPt(link)
        const endProtrude = new Vec(end.x - this.pathEndMinX, end.y)
        const mid = Vec.mid(begProtrude, endProtrude)
        return {
          d: `M ${beg.x} ${beg.y} L ${begProtrude.x} ${begProtrude.y} C ${mid.x} ${begProtrude.y} ${mid.x} ${endProtrude.y} ${endProtrude.x} ${endProtrude.y} L ${end.x} ${end.y}`,
          fill: 'none',
          'stroke-width': this.pathWidth,
          stroke: this.getPathColor(link.weight),
          'stroke-opacity': this.pathOpacity
        }
      })
    },
    verticalGapLanes () {
      const verticalGaps = new Array(this.gridConfig.nVerticalGap)
      for (let iGap = 0; iGap < this.gridConfig.nVerticalGap; ++iGap) {
        const gapLinks =
          _.filter(
            this.verticalGapOrthogonalLinks,
            link => link.reference.col === iGap)
        const sortedGapLinks = _.sortBy(gapLinks, link => {
          return -(link.reference.row * this.gridConfig.nRow + link.citedBy.row)
        })
        _.forEach(sortedGapLinks, link => {
          const minRow = Math.min(link.reference.row, link.citedBy.row)
          const maxRow = Math.max(link.reference.row, link.citedBy.row)
          for (let iRow = minRow; iRow < maxRow; ++iRow) {
            verticalGaps[iGap] = verticalGaps[iGap] || []
            verticalGaps[iGap][iRow] = verticalGaps[iGap][iRow] || []
            const prevLane = _.last(verticalGaps[iGap][iRow])
            const prevLaneRefs = _.uniq(_.map(prevLane, link => link.reference))
            const prevLaneRef =
              prevLaneRefs.length === 1 ? prevLaneRefs[0] : null
            const prevLaneCitedBys =
              _.uniq(_.map(prevLane, link => link.citedBy))
            const prevLaneCitedBy =
              prevLaneCitedBys.length === 1 ? prevLaneCitedBys[0] : null
            const currRef = link.reference
            const currCitedBy = link.citedBy
            if (prevLaneRef === currRef || prevLaneCitedBy === currCitedBy) {
              _.last(verticalGaps[iGap][iRow]).push(link)
            } else {
              verticalGaps[iGap][iRow].push([ link ])
            }
          }
        })
      }
      return verticalGaps
    },
    verticalGapOrthogonalLinks () {
      const verticalGapLinks =
        _.filter(
          this.visGraph.links,
          link => link.citedBy.col - link.reference.col === 1)
      const verticalGapOrthogonalLinks =
        _.filter(
          verticalGapLinks,
          link => link.citedBy.row !== link.reference.row)
      return verticalGapOrthogonalLinks
    },
    verticalGapOrthogonalPaths () {
      const links = this.verticalGapOrthogonalLinks
      return _.map(links, link => {
        const refPt = this.getPathRefPt(link)
        const citedByPt = this.getPathCitedByPt(link)
        const iGap = link.reference.col
        const refRow = link.reference.row
        const citedByRow = link.citedBy.row
        const ySign = Math.sign(citedByRow - refRow)
        if (!ySign) {
          throw new Error('same row?')
        }
        const nSeg = Math.abs(citedByRow - refRow)
        const iSegs =
          _.map(
            new Array(nSeg),
            (value, index) => refRow + Math.min(0, ySign) + ySign * index)
        const segXs = _.map(iSegs, iSeg => {
          return this.getVerticalGapLaneX(
            this.verticalGapLanes[iGap][iSeg], link)
        })
        const firstSegX = _.first(segXs)
        const lastSegX = _.last(segXs)
        const firstSegEndY = this.getCardTop(refRow + ySign) - this.cardHeight * Math.min(0, ySign) + this.cardBorderRadius * ySign
        const lastSegBegY = this.getCardTop(citedByRow - ySign) + this.cardHeight * Math.max(0, ySign) - this.cardBorderRadius * ySign
        const refProtrude = new Vec(refPt.x + this.pathEndMinX, refPt.y)
        const citedByProtrude =
          new Vec(citedByPt.x - this.pathEndMinX, citedByPt.y)
        let pathD = ''
        // first arc
        pathD += `M ${refPt.x} ${refPt.y} L ${refProtrude.x} ${refProtrude.y}`
        const refRect = this.getCardRect(link.reference.colRow)
        const firstConnWidth =
          link.reference.inGraphVisCitedBys.length * this.pathWidth
        const firstMinSegBegY = refRect.center.y + 0.5 * firstConnWidth * ySign
        const firstMinRadius =
          Math.min(
            this.verticalGapOrthogonalPathRadius,
            Math.abs(firstSegEndY - firstMinSegBegY))
        const firstSegBegY = firstMinSegBegY + ySign * firstMinRadius
        const firstRadius = Math.abs(firstSegBegY - refProtrude.y)
        pathD += ` L ${firstSegX - firstRadius} ${refProtrude.y} Q ${firstSegX} ${refProtrude.y} ${firstSegX} ${refProtrude.y + firstRadius * ySign}`
        pathD += ` L ${firstSegX} ${firstSegEndY}`
        // middle curves
        for (let i = 1; i < nSeg; ++i) {
          const currRow = iSegs[i] - Math.min(0, ySign)
          // console.log(prevRow, currRow)
          const nextRow = iSegs[i + 1] - Math.min(0, ySign)
          const prevSegX = segXs[i - 1]
          const currSegX = segXs[i]
          const prevSegMaxY = this.getCardTop(currRow) - this.cardHeight * Math.min(0, ySign) + this.cardBorderRadius * ySign
          const currSegMinY = this.getCardTop(currRow) + this.cardHeight * Math.max(0, ySign) - this.cardBorderRadius * ySign
          const currSegMaxY = this.getCardTop(nextRow) - this.cardHeight * Math.min(0, ySign) + this.cardBorderRadius * ySign
          pathD += ` C ${prevSegX} ${0.5 * (prevSegMaxY + currSegMinY)} ${currSegX} ${0.5 * (prevSegMaxY + currSegMinY)} ${currSegX} ${currSegMinY}`
          if (i === nSeg - 1) {
            pathD += ` L ${lastSegX} ${lastSegBegY}`
          } else {
            pathD += ` L ${currSegX} ${currSegMaxY}`
          }
        }
        // last arc
        const citedByRect = this.getCardRect(link.citedBy.colRow)
        const lastConnWidth =
          link.citedBy.inGraphVisReferences.length * this.pathWidth
        const lastMinSegEndY =
          citedByRect.center.y - 0.5 * lastConnWidth * ySign
        const lastMinRadius =
          Math.min(
            this.verticalGapOrthogonalPathRadius,
            Math.abs(lastMinSegEndY - lastSegBegY))
        const lastSegEndY = lastMinSegEndY - ySign * lastMinRadius
        const lastRadius = Math.abs(lastSegEndY - citedByProtrude.y)
        // pathD += ` L ${lastSegX} ${lastSegBegY}`
        pathD += ` L ${lastSegX} ${lastSegEndY}`
        pathD += ` Q ${lastSegX} ${citedByProtrude.y} ${lastSegX + lastRadius} ${citedByProtrude.y}`
        pathD += ` L ${citedByProtrude.x} ${citedByProtrude.y}`
        pathD += ` L ${citedByPt.x} ${citedByPt.y}`
        return {
          d: pathD,
          fill: 'none',
          'stroke-width': this.pathWidth,
          stroke: this.getPathColor(link.weight),
          'stroke-opacity': this.pathOpacity
        }
      })
    },
    visGraph () {
      return new VisGraph(this.visNodes)
    },
    visNodes () {
      const nodes = new Array(this.graph.nodes.length)
      for (let iNode = 0; iNode < nodes.length; ++iNode) {
        nodes[iNode] =
          new VisNode(
            this.graph.nodes[iNode] /* node */,
            this.sortedIndexColRows[iNode] /* colRow */,
            [] /* inGraphReferences */,
            [] /* inGraphCitedBys */,
            [] /* inGraphVisReferences */,
            [] /* inGraphVisCitedBys */)
      }
      for (let iNode = 0; iNode < nodes.length; ++iNode) {
        nodes[iNode].inGraphReferences =
          _.map(
            nodes[iNode].node.inGraphReferences,
            node => nodes[_.indexOf(this.graph.nodes, node)])
        nodes[iNode].inGraphCitedBys =
          _.map(
            nodes[iNode].node.inGraphCitedBys,
            node => nodes[_.indexOf(this.graph.nodes, node)])
      }
      _.forEach(
        this.graph.links, ({ reference: refNode, citedBy: citedByNode }) => {
          const allPaths = this.graph.getAllPathsBetween(refNode, citedByNode)
          const maxLength = _.max(_.map(allPaths, path => path.length))
          const paths = _.filter(allPaths, path => path.length === maxLength)
          _.forEach(paths, path => {
            _.forEach(path, link => {
              const refVisNode =
                _.find(nodes, visNode => visNode.node === link.reference)
              const citedByVisNode =
                _.find(nodes, visNode => visNode.node === link.citedBy)
              // the citedBys array of the referenced node
              const refConn =
                _.find(
                  refVisNode.inGraphVisCitedBys,
                  conn => conn.node === citedByVisNode) ||
                { node: citedByVisNode, weight: 0 }
              ++refConn.weight
              refVisNode.inGraphVisCitedBys =
                _.union(refVisNode.inGraphVisCitedBys, [ refConn ])
              // the references array of the cited by node
              const citedByConn =
                _.find(
                  citedByVisNode.inGraphVisReferences,
                  conn => conn.node === refVisNode) ||
                { node: refVisNode, weight: 0 }
              ++citedByConn.weight
              citedByVisNode.inGraphVisReferences =
                _.union(citedByVisNode.inGraphVisReferences, [ citedByConn ])
            })
          })
        })
      _.forEach(nodes, visNode => {
        // sort in-graph connections according to columns and rows
        const currRect = this.getCardRect(visNode.colRow)
        visNode.inGraphVisReferences =
          _.sortBy(visNode.inGraphVisReferences, ({ node: refVisNode }) => {
            const refRect = this.getCardRect(refVisNode.colRow)
            const x = refRect.center.x - currRect.center.x
            const y = refRect.center.y - currRect.center.y
            return -y / x
          })
        visNode.inGraphVisCitedBys =
          _.sortBy(visNode.inGraphVisCitedBys, ({ node: citedByVisNode }) => {
            const citedByRect = this.getCardRect(citedByVisNode.colRow)
            const x = citedByRect.center.x - currRect.center.x
            const y = citedByRect.center.y - currRect.center.y
            return y / x
          })
      })
      return nodes
    }
  },
  methods: {
    getCardLeft (iCol) {
      const sumOfSpacings = iCol * this.cardHorizontalSpacing
      const sumOfCardWidths = iCol * this.cardWidth
      return this.canvasPadding.left + sumOfSpacings + sumOfCardWidths
    },
    getCardRect ({ col, row }) {
      // TODO: use a Rect class
      return {
        left: this.getCardLeft(col),
        top: this.getCardTop(row),
        right: this.getCardLeft(col) + this.cardWidth,
        bottom: this.getCardTop(row) + this.cardHeight,
        width: this.cardWidth,
        height: this.cardHeight,
        center: {
          x: this.getCardLeft(col) + 0.5 * this.cardWidth,
          y: this.getCardTop(row) + 0.5 * this.cardHeight
        }
      }
    },
    getCardSideColor (count) {
      const scalar = 1 - Math.exp(Math.log(1) - this.cardSideDarkness * count)
      return interpolateColor(scalar)
    },
    getCardSideStyle (count) {
      return {
        opacity: this.cardOpacity,
        flex: `0 0 ${this.cardSideWidth}em`,
        backgroundColor: this.getCardSideColor(count)
      }
    },
    getCardStyle (visNode) {
      return {
        position: 'absolute',
        left: `${this.getCardLeft(visNode.col)}em`,
        top: `${this.getCardTop(visNode.row)}em`,
        width: `${this.cardWidth}em`,
        height: `${this.cardHeight}em`,
        background: 'rgba(255, 255, 255, 0.0)',
        borderRadius: this.cardBorderRadius + 'em',
        borderStyle: 'solid',
        borderWidth: '1px',
        display: 'flex',
        overflow: 'hidden'
      }
    },
    getCardTop (iRow) {
      const sumOfSpacings = iRow * this.cardVerticalSpacing
      const sumOfCardHeights = iRow * this.cardHeight
      return this.canvasPadding.top + sumOfSpacings + sumOfCardHeights
    },
    getLabelRowText (node) {
      return `${node.article.data.authors[0].surname} ${node.article.data.year}`
    },
    getPathColor (weight) {
      const scalar = 1 - Math.exp(Math.log(1) - this.pathDarkness * weight)
      return interpolateColor(scalar)
    },
    getPathCitedByPt (link) {
      const citedByVisNode = link.citedBy
      const index =
        _.findIndex(
          citedByVisNode.inGraphVisReferences,
          ({ node: visNode }) => visNode === link.reference)
      const nConns = citedByVisNode.inGraphVisReferences.length
      const totalWidth = nConns * this.pathWidth
      const citedByRect = this.getCardRect(link.citedBy.colRow)
      const yMin = citedByRect.center.y - 0.5 * totalWidth
      const y = yMin + index * this.pathWidth + 0.5 * this.pathWidth
      const x = citedByRect.left
      return new Vec(x, y)
    },
    getPathRefPt (link) {
      const refVisNode = link.reference
      const index =
        _.findIndex(
          refVisNode.inGraphVisCitedBys,
          ({ node: visNode }) => visNode === link.citedBy)
      const nConns = refVisNode.inGraphVisCitedBys.length
      const totalWidth = nConns * this.pathWidth
      const refRect = this.getCardRect(link.reference.colRow)
      const yMin = refRect.center.y - 0.5 * totalWidth
      const y = yMin + index * this.pathWidth + 0.5 * this.pathWidth
      const x = refRect.right
      return new Vec(x, y)
    },
    getVerticalGapLaneX (lanes, link) {
      const iLane = _.findIndex(lanes, lane => _.includes(lane, link))
      const iSublane = _.indexOf(lanes[iLane], link)
      const nSublanes = _.map(lanes, lane => lane.length)
      const laneWidths = _.map(nSublanes, nSublane => nSublane * this.pathWidth)
      const runningLaneWidths = prefixSum(laneWidths)
      const runningLaneSpacings = new Array(lanes.length)
      for (let iLane = 0; iLane < lanes.length; ++iLane) {
        runningLaneSpacings[iLane] = iLane * this.verticalGapLaneSpacing
      }
      const totalLaneWidth = _.last(runningLaneWidths)
      const totalLaneSpacing = _.last(runningLaneSpacings)
      const refRect = this.getCardRect(link.reference.colRow)
      const citedByRect = this.getCardRect(link.citedBy.colRow)
      const midX = 0.5 * (refRect.right + citedByRect.left)
      const minX = midX - 0.5 * (totalLaneWidth + totalLaneSpacing)
      const laneOffset = runningLaneWidths[iLane] + runningLaneSpacings[iLane]
      const sublaneOffset = iSublane * this.pathWidth + 0.5 * this.pathWidth
      return minX + laneOffset + sublaneOffset
    },
    trace (value) {
      console.log(value)
      return value
    }
  }
}

// TODO: move these classes to pvmodels.js
class VisGraph {
  constructor (visNodes) {
    this.nodes = visNodes
  }

  get links () {
    return _.flatten(_.map(this.nodes, (node, index) => {
      const citedBys = node.inGraphVisCitedBys
      return _.map(
        citedBys, citedBy => new VisLink(node, citedBy.node, citedBy.weight))
    }))
  }
}

class VisLink {
  constructor (reference, citedBy, weight) {
    this.reference = reference
    this.citedBy = citedBy
    this.weight = weight
  }
}

class VisNode {
  constructor (
    node, colRow, inGraphReferences, inGraphCitedBys, inGraphVisReferences,
    inGraphVisCitedBys) {
    this.node = node
    this.colRow = colRow
    this.inGraphReferences = inGraphReferences
    this.inGraphCitedBys = inGraphCitedBys
    this.inGraphVisReferences = inGraphVisReferences
    this.inGraphVisCitedBys = inGraphVisCitedBys
  }
  get article () { return this.node.article }
  get col () { return this.colRow.col }
  get row () { return this.colRow.row }
}

function getNodeLevels (nodes, rootProp, connProp) {
  let levels = _.times(nodes.length, _.constant(0))
  const rootIndexes = nodes.reduce((paperIndexes, node, paperIndex) => {
    if (node[rootProp].length === 0) {
      paperIndexes.push(paperIndex)
    }
    return paperIndexes
  }, [])
  rootIndexes.forEach(paperIndex => { levels[paperIndex] = 0 })
  let bfsQueue = [].concat(rootIndexes)
  while (bfsQueue.length > 0) {
    const currIndex = bfsQueue.shift()
    const connNodes = nodes[currIndex][connProp]
    const paperIndexes = _.map(connNodes, node => _.findIndex(nodes, node))

    paperIndexes.forEach(paperIndex => {
      levels[paperIndex] = levels[paperIndex] ? Math.max(levels[currIndex] + 1, levels[paperIndex]) : levels[currIndex] + 1
      bfsQueue.push(paperIndex)
    })
  }
  return levels
}

function prefixSum (values) {
  return _.reduce(values, (result, value) => {
    result = _.concat(result, value + _.last(result))
    return result
  }, [ 0 ])
}
</script>

<style scoped>
.vis-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.cards-container {
  position: absolute;
  left: 0px;
  top: 0px;
  overflow: hidden;
}

.card-row {
  min-height: 0px;
}

.overlay-container {
  position: absolute;
  left: 0px;
  top: 0px;
  overflow: hidden;
}
</style>
