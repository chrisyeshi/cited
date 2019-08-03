<template>
  <v-content>
    <div ref="visContainer" class="vis-container"
      @click="onCanvasClicked" v-resize.initial="onVisContainerResize">
      <svg class="overlay-container" :style="overlayContainerStyle"
        :viewBox="`0 0 ${this.canvasWidth} ${this.canvasHeight}`">
        <path v-for="(props, key) in paths" :key="key" v-bind="props"></path>
      </svg>
      <div class="cards-container" :style="cardsContainerStyle"
        @click="onCanvasClicked">
        <pv-vis-node-card v-for="node in visGraph.visNodes"
          :key="node.articleId" ref="cards" :visNode="node"
          :config="visConfig.card" :class="getCardClasses(node)"
          :style="getCardStyle(node)"
          :backgroundColor="getCardBackgroundColor(node)"
          :citedByColor="getCardSideColor(node.inGraphCitedBys.length)"
          :referenceColor="getCardSideColor(node.inGraphReferences.length)"
          @click.native.stop="onCardClicked($event, node)"
          @mouseenter.native.stop="onCardMouseEnter(node)"
          @mouseleave.native.stop="onCardMouseLeave(node)">
        </pv-vis-node-card>
      </div>
    </div>
  </v-content>
</template>

<script>
import _ from 'lodash'
import * as d3Color from 'd3-color'
import { interpolateBuPu as interpolateColor } from 'd3-scale-chromatic'
import getVisCardSideColor from './getviscardsidecolor.js'
import { mapState } from 'vuex'
import { VisGraph } from '@/components/visgraph.js'
import ExpandableText from './ExpandableText.vue'
import getSampleCollection from './getsamplecollection.js'
import PvArticleForm from './PvArticleForm.vue'
import PvExpandableAuthorsLinks from './PvExpandableAuthorsLinks.vue'
import PvVisNodeCard from './PvVisNodeCard.vue'
import resize from 'vue-resize-directive'
import Vec from './vec.js'

export default {
  name: 'PvVisView',
  directives: { resize },
  components: {
    ExpandableText, PvArticleForm, PvExpandableAuthorsLinks, PvVisNodeCard
  },
  data () {
    return {
      visConfig: {
        card: {
          borderRadius: 0.65,
          height: 6.8,
          lineClamp: 2,
          opacity: 0.8,
          sideDarkness: 0.2,
          sideWidth: 0.5,
          titleLineHeight: 1.3,
          unit: 'em',
          width: 15
        },
        cardSelectedBackgroundColor: d3Color.rgb('lightyellow'),
        cardGreyedOutOpacity: 0.25,
        cardHorizontalSpacing: 4,
        cardTransitionDuration: '0.25s',
        cardVerticalSpacing: 0.8,
        canvasPadding: { left: 2, top: 2, right: 2, bottom: 2 },
        fontSize: 12,
        hoveringCardElevation: 6,
        hoverLinger: 50,
        path: {
          darkness: 0.35,
          endMinX: 0.5,
          greyedOutColor: 'lightgray',
          greyedOutOpacity: 0.25,
          opacity: 0.8,
          width: 0.175
        },
        verticalGapLaneSpacing: 0.4,
        verticalGapOrthogonalPathRadius: 0.75
      },
      visContainerWidth: 0,
      visContainerHeight: 0
    }
  },
  computed: {
    ...mapState('parseVis', [
      'currUserId', 'currCollId', 'temporaryArticleIds', 'hoveringArticleId',
      'selectedArticleIds'
    ]),
    canvasHeight () {
      const nRows = this.gridConfig.nRow
      const paddings = this.visConfig.canvasPadding.top + this.visConfig.canvasPadding.bottom
      const spacing =
        Math.max(0, nRows - 1) * this.visConfig.cardVerticalSpacing
      const prevHeight = nRows * this.visConfig.card.height
      const height = paddings + spacing + prevHeight
      return Math.max(height, this.visContainerHeight)
    },
    canvasWidth () {
      const nColumns = this.maxReferenceLevel + 1
      const width = this.visConfig.canvasPadding.left + nColumns * this.visConfig.card.width + (nColumns - 1) * this.visConfig.cardHorizontalSpacing + this.visConfig.canvasPadding.right
      return Math.max(width, this.visContainerWidth)
    },
    cardsContainerStyle () {
      return {
        fontSize: this.visConfig.fontSize + 'px',
        width: this.canvasWidth + 'em',
        height: this.canvasHeight + 'em'
      }
    },
    focusedVisNodeIds () {
      const hoveringArtId = this.hoveringVisNodeId
      const selectedArtIds = this.selectedVisNodeIds
      const artIds = _.uniq(_.filter([ hoveringArtId, ...selectedArtIds ]))
      const visNodeIds = _.filter(artIds, artId => this.baseVisGraph.has(artId))
      const focusedVisNodeIds = [
        ...visNodeIds,
        ..._.flatMap(
          visNodeIds,
          visNodeId => this.baseVisGraph.getInGraphReferenceIds(visNodeId)),
        ..._.flatMap(
          visNodeIds,
          visNodeId => this.baseVisGraph.getInGraphCitedByIds(visNodeId))
      ]
      return _.uniq(focusedVisNodeIds)
    },
    hoveringVisNodeId () {
      return this.hoveringArticleId
    },
    selectedVisNodeIds () {
      return this.selectedArticleIds
    },
    gridConfig () {
      return this.getGridConfig()
    },
    maxReferenceLevel () { return Math.max(0, this.visGraph.grid.length - 1) },
    overlayContainerStyle () {
      return {
        fontSize: this.visConfig.fontSize + 'px',
        width: this.canvasWidth + 'em',
        height: this.canvasHeight + 'em'
      }
    },
    paths () {
      return [
        ...this.getVerticalGapOrthogonalPaths(this.visLinks),
        ...this.getVerticalGapHorizontalPaths(this.visLinks),
        ...this.getCrossColumnPaths(this.visLinks)
      ]
    },
    visLinks () {
      if (this.focusedVisNodeIds.length === 0) {
        return this.visGraph.visLinks
      }
      const focusedVisGraph =
        VisGraph.extractSubgraph(this.visGraph, this.focusedVisNodeIds)
      const focusedVisLinks = _.map(focusedVisGraph.visLinks, visLink => {
        const visGraph = this.visGraph
        return {
          ...visLink,
          referenceId: visLink.referenceId,
          get reference () { return visGraph.getVisNode(this.referenceId) },
          citedById: visLink.citedById,
          get citedBy () { return visGraph.getVisNode(this.citedById) },
          color: this.getPathColorByWeight(visLink.weight),
          opacity: this.visConfig.path.opacity
        }
      })
      const otherVisLinks =
        _.differenceWith(
          this.visGraph.visLinks, focusedVisLinks, (aLink, bLink) => {
            return aLink.referenceId === bLink.referenceId &&
              aLink.citedById === bLink.citedById
          })
      const greyedOutVisLinks = _.map(otherVisLinks, visLink => ({
        ...visLink,
        color: this.visConfig.path.greyedOutColor,
        opacity: this.visConfig.path.greyedOutOpacity
      }))
      const visLinks = [ ...greyedOutVisLinks, ...focusedVisLinks ]
      return visLinks
    }
  },
  asyncComputed: {
    baseVisGraph: {
      default: new VisGraph(),
      async get () {
        if (!this.currCollId) {
          return new VisGraph()
        }
        if (this.currUserId === 'sample') {
          return VisGraph.fromColl(await getSampleCollection(this.currCollId))
        }
        throw new Error('no backend yet at PvVisView.vue:baseVisGraph')
      }
    },
    visGraph: {
      default: new VisGraph({}),
      async get () {
        const tempVisGraph = this.baseVisGraph
        const tempStatuses =
          _.mapValues(
            _.keyBy(this.temporaryArticleIds),
            (value, artId) => this.baseVisGraph.has(artId)
              ? { hovering: true }
              : { temporary: true, hovering: true })
        const hoveringStatus =
          this.hoveringVisNodeId &&
          { [this.hoveringVisNodeId]: { hovering: true } }
        const selectedStatuses =
          _.mapValues(
            _.keyBy(this.selectedVisNodeIds),
            (value, artId) => ({ selected: true }))
        const greyedOutVisNodeIds =
          _.isEmpty(this.focusedVisNodeIds)
            ? []
            : _.without(tempVisGraph.visNodeIds, ...this.focusedVisNodeIds)
        const greyedOutStatuses =
          _.mapValues(
            _.keyBy(greyedOutVisNodeIds),
            (value, artId) => ({ greyedOut: true }))
        const displayedStatus =
          this.drawerArticleId &&
          { [this.drawerArticleId]: { displayed: true } }
        const statusesMap =
          _.merge(
            {}, tempStatuses, hoveringStatus, selectedStatuses,
            greyedOutStatuses, displayedStatus)
        return VisGraph.mergeStats(tempVisGraph, statusesMap)
      }
    }
  },
  methods: {
    getCardBackgroundColor (visNode) {
      return visNode.visStatus.displayed
        ? this.visConfig.cardSelectedBackgroundColor
        : undefined
    },
    getCardClasses (visNode) {
      return visNode.visStatus.hovering || visNode.visStatus.selected
        ? [ `elevation-${this.visConfig.hoveringCardElevation}` ]
        : []
    },
    getCardLeft (iCol) {
      const sumOfSpacings = iCol * this.visConfig.cardHorizontalSpacing
      const sumOfCardWidths = iCol * this.visConfig.card.width
      return this.visConfig.canvasPadding.left + sumOfSpacings + sumOfCardWidths
    },
    getCardRect ({ col, row }) {
      // TODO: use a Rect class
      return {
        left: this.getCardLeft(col),
        top: this.getCardTop(row),
        right: this.getCardLeft(col) + this.visConfig.card.width,
        bottom: this.getCardTop(row) + this.visConfig.card.height,
        width: this.visConfig.card.width,
        height: this.visConfig.card.height,
        center: {
          x: this.getCardLeft(col) + 0.5 * this.visConfig.card.width,
          y: this.getCardTop(row) + 0.5 * this.visConfig.card.height
        }
      }
    },
    getCardSideColor (count) {
      return getVisCardSideColor(count, this.visConfig.card.sideDarkness)
    },
    getCardStyle (visNode) {
      return {
        borderStyle: visNode.visStatus.temporary ? 'dashed' : undefined,
        cursor: 'pointer',
        opacity: visNode.visStatus.greyedOut
          ? this.visConfig.cardGreyedOutOpacity
          : 1.0,
        position: 'absolute',
        left: `${this.getCardLeft(visNode.col)}em`,
        top: `${this.getCardTop(visNode.row)}em`,
        width: `${this.visConfig.card.width}em`,
        height: `${this.visConfig.card.height}em`,
        transitionDuration: this.visConfig.cardTransitionDuration
      }
    },
    getCardTop (iRow) {
      const sumOfSpacings = iRow * this.visConfig.cardVerticalSpacing
      const sumOfCardHeights = iRow * this.visConfig.card.height
      return this.visConfig.canvasPadding.top + sumOfSpacings + sumOfCardHeights
    },
    getCrossColumnPaths (visLinks) {
      // TODO: bundle these paths
      const crossColumnLinks =
        _.filter(visLinks, link => link.citedBy.col - link.reference.col > 1)
      return _.map(crossColumnLinks, link => {
        const beg = this.getPathRefPt(link)
        const begProtrude = new Vec(beg.x + this.visConfig.path.endMinX, beg.y)
        const end = this.getPathCitedByPt(link)
        const endProtrude = new Vec(end.x - this.visConfig.path.endMinX, end.y)
        return {
          d: `M ${beg.x} ${beg.y} L ${begProtrude.x} ${begProtrude.y} C ${begProtrude.x + 4 * this.visConfig.path.endMinX} ${begProtrude.y} ${endProtrude.x - 4 * this.visConfig.path.endMinX} ${endProtrude.y} ${endProtrude.x} ${endProtrude.y} L ${end.x} ${end.y}`,
          fill: 'none',
          'stroke-width': this.visConfig.path.width,
          stroke: this.getPathColor(link),
          'stroke-opacity': this.getPathOpacity(link)
        }
      })
    },
    getGridConfig () {
      const grid = this.visGraph.grid
      const nRows = _.map(grid, column => column.length)
      const nRow = _.max(nRows) || 0
      const nCol = grid.length
      return {
        nCol: nCol,
        nHorizontalGap: Math.max(0, nRow - 1),
        nVerticalGap: Math.max(0, nCol - 1),
        nRow: nRow,
        nRows: nRows
      }
    },
    getLabelRowText (article) {
      return `${article.data.authors[0].surname} ${article.data.year}`
    },
    getPathColor (link) {
      return link.color ? link.color : this.getPathColorByWeight(link.weight)
    },
    getPathOpacity (link) {
      return link.opacity ? link.opacity : this.visConfig.path.opacity
    },
    getPathColorByWeight (weight) {
      const scalar =
        1 - Math.exp(Math.log(1) - this.visConfig.path.darkness * weight)
      return interpolateColor(scalar)
    },
    getPathCitedByPt (link) {
      const citedByVisNode = link.citedBy
      const index =
        _.findIndex(
          citedByVisNode.inGraphVisReferences,
          ({ visNode }) => visNode.articleId === link.referenceId)
      const nConns = citedByVisNode.inGraphVisReferences.length
      const totalWidth = nConns * this.visConfig.path.width
      const citedByRect = this.getCardRect(link.citedBy.colRow)
      const yMin = citedByRect.center.y - 0.5 * totalWidth
      const y = yMin + index * this.visConfig.path.width + 0.5 * this.visConfig.path.width
      const x = citedByRect.left
      return new Vec(x, y)
    },
    getPathRefPt (link) {
      const refVisNode = link.reference
      const index =
        _.findIndex(
          refVisNode.inGraphVisCitedBys,
          ({ visNodeId }) => visNodeId === link.citedById)
      const nConns = refVisNode.inGraphVisCitedBys.length
      const totalWidth = nConns * this.visConfig.path.width
      const refRect = this.getCardRect(link.reference.colRow)
      const yMin = refRect.center.y - 0.5 * totalWidth
      const y = yMin + index * this.visConfig.path.width + 0.5 * this.visConfig.path.width
      const x = refRect.right
      return new Vec(x, y)
    },
    getVerticalGapHorizontalPaths (visLinks) {
      const verticalGapLinks =
        _.filter(visLinks, link => link.citedBy.col - link.reference.col === 1)
      const verticalGapHorizontalLinks =
        _.filter(
          verticalGapLinks,
          link => link.citedBy.row === link.reference.row)
      return _.map(verticalGapHorizontalLinks, link => {
        const beg = this.getPathRefPt(link)
        const begProtrude = new Vec(beg.x + this.visConfig.path.endMinX, beg.y)
        const end = this.getPathCitedByPt(link)
        const endProtrude = new Vec(end.x - this.visConfig.path.endMinX, end.y)
        const mid = Vec.mid(begProtrude, endProtrude)
        return {
          d: `M ${beg.x} ${beg.y} L ${begProtrude.x} ${begProtrude.y} C ${mid.x} ${begProtrude.y} ${mid.x} ${endProtrude.y} ${endProtrude.x} ${endProtrude.y} L ${end.x} ${end.y}`,
          fill: 'none',
          'stroke-width': this.visConfig.path.width,
          stroke: this.getPathColor(link),
          'stroke-opacity': this.getPathOpacity(link)
        }
      })
    },
    getVerticalGapLanes (verticalGapLinks) {
      const gridConfig = this.getGridConfig()
      const verticalGaps = new Array(gridConfig.nVerticalGap)
      for (let iGap = 0; iGap < gridConfig.nVerticalGap; ++iGap) {
        const gapLinks =
          _.filter(
            verticalGapLinks,
            link => link.reference.col === iGap)
        const downLinks =
          _.filter(gapLinks, link => link.reference.row < link.citedBy.row)
        const sortedDownLinks = _.sortBy(downLinks, link => {
          return -(link.reference.row * gridConfig.nRow + link.citedBy.row)
        })
        const upLinks =
          _.filter(gapLinks, link => link.reference.row >= link.citedBy.row)
        const sortedUpLinks = _.sortBy(upLinks, link => {
          return (link.reference.row * gridConfig.nRow + link.citedBy.row)
        })
        const sortedGapLinks = [ ...sortedDownLinks, ...sortedUpLinks ]
        _.forEach(sortedGapLinks, link => {
          const minRow = Math.min(link.reference.row, link.citedBy.row)
          const maxRow = Math.max(link.reference.row, link.citedBy.row)
          for (let iRow = minRow; iRow < maxRow; ++iRow) {
            verticalGaps[iGap] = verticalGaps[iGap] || []
            verticalGaps[iGap][iRow] = verticalGaps[iGap][iRow] || []
            const prevLane = _.last(verticalGaps[iGap][iRow])
            const prevLaneRefs =
              _.uniq(_.map(prevLane, link => link.referenceId))
            const prevLaneRef =
              prevLaneRefs.length === 1 ? prevLaneRefs[0] : null
            const prevLaneCitedBys =
              _.uniq(_.map(prevLane, link => link.citedById))
            const prevLaneCitedBy =
              prevLaneCitedBys.length === 1 ? prevLaneCitedBys[0] : null
            const currRef = link.referenceId
            const currCitedBy = link.citedById
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
    getVerticalGapLaneX (lanes, link) {
      const iLane = _.findIndex(lanes, lane => _.includes(lane, link))
      const iSublane = _.indexOf(lanes[iLane], link)
      const nSublanes = _.map(lanes, lane => lane.length)
      const laneWidths =
        _.map(nSublanes, nSublane => nSublane * this.visConfig.path.width)
      const runningLaneWidths = prefixSum(laneWidths)
      const runningLaneSpacings = new Array(lanes.length)
      for (let iLane = 0; iLane < lanes.length; ++iLane) {
        runningLaneSpacings[iLane] =
          iLane * this.visConfig.verticalGapLaneSpacing
      }
      const totalLaneWidth = _.last(runningLaneWidths)
      const totalLaneSpacing = _.last(runningLaneSpacings)
      const refRect = this.getCardRect(link.reference.colRow)
      const citedByRect = this.getCardRect(link.citedBy.colRow)
      const midX = 0.5 * (refRect.right + citedByRect.left)
      const minX = midX - 0.5 * (totalLaneWidth + totalLaneSpacing)
      const laneOffset = runningLaneWidths[iLane] + runningLaneSpacings[iLane]
      const sublaneOffset =
        iSublane * this.visConfig.path.width + 0.5 * this.visConfig.path.width
      return minX + laneOffset + sublaneOffset
    },
    getVerticalGapOrthogonalLinks (links) {
      const verticalGapLinks =
        _.filter(links, link => link.citedBy.col - link.reference.col === 1)
      const verticalGapOrthogonalLinks =
        _.filter(
          verticalGapLinks,
          link => link.citedBy.row !== link.reference.row)
      return verticalGapOrthogonalLinks
    },
    getVerticalGapOrthogonalPaths (allLinks) {
      const links = this.getVerticalGapOrthogonalLinks(allLinks)
      const verticalGapLanes = this.getVerticalGapLanes(links)
      return _.map(links, link => {
        const refPt = this.getPathRefPt(link)
        const citedByPt = this.getPathCitedByPt(link)
        const iGap = link.reference.col
        const refRow = link.reference.row
        const citedByRow = link.citedBy.row
        const ySign = Math.sign(citedByRow - refRow)
        const cardOuterWidth = 2 * this.visConfig.card.borderRadius
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
            verticalGapLanes[iGap][iSeg], link)
        })
        const firstSegX = _.first(segXs)
        const lastSegX = _.last(segXs)
        const firstSegEndY = this.getCardTop(refRow + ySign) - this.visConfig.card.height * Math.min(0, ySign) + cardOuterWidth * ySign
        const lastSegBegY = this.getCardTop(citedByRow - ySign) + this.visConfig.card.height * Math.max(0, ySign) - cardOuterWidth * ySign
        const refProtrude = new Vec(refPt.x + this.visConfig.path.endMinX, refPt.y)
        const citedByProtrude =
          new Vec(citedByPt.x - this.visConfig.path.endMinX, citedByPt.y)
        let pathD = ''
        // first arc
        pathD += `M ${refPt.x} ${refPt.y} L ${refProtrude.x} ${refProtrude.y}`
        const refRect = this.getCardRect(link.reference.colRow)
        const firstConnWidth =
          link.reference.inGraphVisCitedBys.length * this.visConfig.path.width
        const firstMinSegBegY = refRect.center.y + 0.5 * firstConnWidth * ySign
        const firstMinRadius =
          Math.min(
            this.visConfig.verticalGapOrthogonalPathRadius,
            Math.abs(firstSegEndY - firstMinSegBegY))
        const firstSegBegY = firstMinSegBegY + ySign * firstMinRadius
        const firstRadius = Math.abs(firstSegBegY - refProtrude.y)
        pathD += ` L ${firstSegX - firstRadius} ${refProtrude.y} Q ${firstSegX} ${refProtrude.y} ${firstSegX} ${refProtrude.y + firstRadius * ySign}`
        pathD += ` L ${firstSegX} ${firstSegEndY}`
        // middle curves
        for (let i = 1; i < nSeg; ++i) {
          const currRow = iSegs[i] - Math.min(0, ySign)
          const nextRow = iSegs[i + 1] - Math.min(0, ySign)
          const prevSegX = segXs[i - 1]
          const currSegX = segXs[i]
          const prevSegMaxY = this.getCardTop(currRow) - this.visConfig.card.height * Math.min(0, ySign) + cardOuterWidth * ySign
          const currSegMinY = this.getCardTop(currRow) + this.visConfig.card.height * Math.max(0, ySign) - cardOuterWidth * ySign
          const currSegMaxY = this.getCardTop(nextRow) - this.visConfig.card.height * Math.min(0, ySign) + cardOuterWidth * ySign
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
          link.citedBy.inGraphVisReferences.length * this.visConfig.path.width
        const lastMinSegEndY =
          citedByRect.center.y - 0.5 * lastConnWidth * ySign
        const lastMinRadius =
          Math.min(
            this.visConfig.verticalGapOrthogonalPathRadius,
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
          'stroke-width': this.visConfig.path.width,
          stroke: this.getPathColor(link),
          'stroke-opacity': this.getPathOpacity(link)
        }
      })
    },
    onAddDrawerArticleToVis (artId) {
      this.$emit('add-to-vis', artId)
    },
    onCanvasClicked () {
      this.$store.commit('parseVis/set', { selectedArticleIds: [] })
    },
    onCardClicked (event, visNode) {
      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        // multiple selection
        if (visNode.visStatus.selected) {
          this.$store.commit('parseVis/set', {
            selectedArticleIds:
              _.without(this.selectedVisNodeIds, visNode.visNodeId)
          })
        } else {
          this.$store.commit('parseVis/set', {
            selectedArticleIds:
              _.union(this.selectedVisNodeIds, [ visNode.visNodeId ])
          })
        }
        this.isDrawerOpenComputed = false
      } else {
        // single selection
        this.$router.push({
          name: 'parsevis',
          query: {
            user: this.currUserId,
            coll: this.currCollId,
            art: visNode.articleId
          }
        })
        this.$store.commit('parseVis/set', {
          currUserId: this.currUserId,
          currCollId: this.currCollId,
          currArtId: visNode.articleId,
          drawerState: { name: 'pv-drawer-article-view' },
          selectedArticleIds: [ visNode.visNodeId ]
        })
        this.isDrawerOpenComputed = true
      }
    },
    onCardMouseEnter (visNode) {
      clearTimeout(this.hoverLingerTimer)
      this.$store.commit('parseVis/set', {
        hoveringArticleId: visNode.visNodeId
      })
    },
    onCardMouseLeave (visNode) {
      this.hoverLingerTimer = setTimeout(() => {
        this.$store.commit('parseVis/set', {
          hoveringArticleId: null
        })
      }, this.visConfig.hoverLinger)
    },
    onVisContainerResize (el) {
      this.visContainerWidth = el.offsetWidth / this.visConfig.fontSize
      this.visContainerHeight = el.offsetHeight / this.visConfig.fontSize
    },
    trace (value) {
      console.log(value)
      return value
    }
  }
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

.overlay-container {
  position: absolute;
  left: 0px;
  top: 0px;
  overflow: hidden;
}
</style>
