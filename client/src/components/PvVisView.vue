<template>
  <v-content>
    <v-navigation-drawer app floating stateless clipped :width="drawerWidth"
      v-model="isDrawerOpenComputed">
      <v-container v-if="isDrawerEmpty">Drawer Empty</v-container>
      <pv-vis-drawer-editable-article v-if="isDrawerArticle"
        :article-id="drawerArticleId" :card-config="visConfig.card"
        :get-card-cited-by-color="getArticleCardCitedByColor"
        :get-card-reference-color="getArticleCardReferenceColor"
        @add-to-vis="onAddDrawerArticleToVis"
        @article-edited="articleEdited"
        @select-article="onDrawerArticleSelected"
        @unselect-article="onDrawerArticleUnselected">
      </pv-vis-drawer-editable-article>
      <pv-vis-drawer-query-list v-if="isDrawerList"
        style="position: relative; height: 100%; overflow: auto;"
        :page-query="drawerPageQuery"
        @click-item-title="onDrawerListItemTitleClicked">
      </pv-vis-drawer-query-list>
    </v-navigation-drawer>
    <div v-if="isGraphViewVisible" ref="visContainer" class="vis-container"
      @click="onCanvasClicked">
      <svg class="overlay-container" :style="overlayContainerStyle" :viewBox="`0 0 ${this.canvasWidth} ${this.canvasHeight}`">
        <path v-for="(props, key) in paths" :key="key" v-bind="props"></path>
      </svg>
      <div class="cards-container" :style="cardsContainerStyle"
        @click="onCanvasClicked">
        <pv-vis-card v-for="node in visGraph.visNodes" :key="node.articleId"
          ref="cards" :article="node.articleId" :config="visConfig.card"
          :class="getCardClasses(node)" :style="getCardStyle(node)"
          :backgroundColor="getCardBackgroundColor(node)"
          :citedByColor="getCardSideColor(node.inGraphCitedBys.length)"
          :referenceColor="getCardSideColor(node.inGraphReferences.length)"
          @click.native.stop="onCardClicked($event, node)"
          @mouseenter.native.stop="onCardMouseEnter(node)"
          @mouseleave.native.stop="onCardMouseLeave(node)">
        </pv-vis-card>
      </div>
    </div>
    <v-layout v-if="isEmptyViewVisible" fill-height justify-center align-center>
      <v-dialog max-width="680" scrollable :disabled="!articleEditable">
        <v-btn flat slot="activator">{{ emptyViewMessage }}</v-btn>
        <v-container style="background: white;">
          <pv-article-form></pv-article-form>
        </v-container>
      </v-dialog>
    </v-layout>
  </v-content>
</template>

<script>
import _ from 'lodash'
import * as d3Color from 'd3-color'
import { interpolateBuPu as interpolateColor } from 'd3-scale-chromatic'
import { mapState } from 'vuex'
import { VisGraph, VisLink } from './pvvismodels.js'
import ExpandableText from './ExpandableText.vue'
import PvArticleForm from './PvArticleForm.vue'
import PvExpandableAuthorsLinks from './PvExpandableAuthorsLinks.vue'
import PvVisCard from './PvVisCard.vue'
import PvVisDrawerEditableArticle from './PvVisDrawerEditableArticle.vue'
import PvVisDrawerQueryList from './PvVisDrawerQueryList.vue'
import theArticlePool from './pvarticlepool.js'
import Vec from './vec.js'

export default {
  name: 'PvVisView',
  components: { ExpandableText, PvArticleForm, PvExpandableAuthorsLinks, PvVisCard, PvVisDrawerEditableArticle, PvVisDrawerQueryList },
  props: {
    collectionArticleIds: Array,
    currentDrawerArticleId: String,
    drawerPageQuery: Object,
    isDrawerOpen: false
  },
  data () {
    return {
      drawerWidth: 450,
      hoveringVisNode: null,
      selectedVisNodes: [],
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
        hoveringCardElevation: 2,
        hoverLinger: 100,
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
      }
    }
  },
  computed: {
    ...mapState('parseVis', [ 'articleEditable' ]),
    canvasHeight () {
      const nRows = this.gridConfig.nRow
      const paddings = this.visConfig.canvasPadding.top + this.visConfig.canvasPadding.bottom
      const spacing =
        Math.max(0, nRows - 1) * this.visConfig.cardVerticalSpacing
      const prevHeight = nRows * this.visConfig.card.height
      return paddings + spacing + prevHeight
    },
    canvasWidth () {
      const nColumns = this.maxReferenceLevel + 1
      return this.visConfig.canvasPadding.left + nColumns * this.visConfig.card.width + (nColumns - 1) * this.visConfig.cardHorizontalSpacing + this.visConfig.canvasPadding.right
    },
    cardsContainerStyle () {
      return {
        fontSize: this.visConfig.fontSize + 'px',
        width: this.canvasWidth + 'em',
        height: this.canvasHeight + 'em'
      }
    },
    drawerArticleId () {
      return this.currentDrawerArticleId
    },
    emptyViewMessage () {
      return this.articleEditable
        ? 'Add articles to visualization'
        : 'Search articles to visualize'
    },
    focusedVisNodes () {
      const visNodes =
        _.uniq(_.filter([ this.hoveringVisNode, ...this.selectedVisNodes ]))
      const focusedVisNodes = _.uniq(_.flatten(_.map(visNodes, visNode => ([
        visNode, ...visNode.inGraphReferences, ...visNode.inGraphCitedBys
      ]))))
      return focusedVisNodes
    },
    gridConfig () {
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
    isDrawerArticle () {
      return this.isDrawerVisNode || this.currentDrawerArticleId
    },
    isDrawerEmpty () { return !this.isDrawerArticle && !this.isDrawerList },
    isDrawerList () {
      return !this.isDrawerArticle && this.drawerPageQuery
    },
    isDrawerListEmptyVisible () {
      return this.drawerPageQueryStatus.isEmpty
    },
    isDrawerOpenComputed: {
      set (value) {
        this.$emit('update:isDrawerOpen', value)
      },
      get () {
        return this.isDrawerOpen
      }
    },
    isDrawerVisNode () { return this.selectedVisNodes.length === 1 },
    isEmptyViewVisible () { return this.collectionArticleIds.length === 0 },
    isGraphViewVisible () { return this.collectionArticleIds.length !== 0 },
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
    }
  },
  asyncComputed: {
    visGraph: {
      default: new VisGraph([]),
      async get () {
        return VisGraph.fromArticleIds(
          theArticlePool, this.collectionArticleIds)
      }
    },
    visLinks: {
      default: [],
      async get () {
        if (this.focusedVisNodes.length === 0) {
          return this.visGraph.visLinks
        }
        const focusedVisGraph =
          this.visGraph.getSubVisGraph(this.focusedVisNodes)
        const focusedVisLinks = _.map(focusedVisGraph.visLinks, visLink => {
          const reference = this.visGraph.getVisNode(visLink.reference.articleId)
          const citedBy = this.visGraph.getVisNode(visLink.citedBy.articleId)
          return new VisLink(
            reference,
            citedBy,
            visLink.weight,
            this.getPathColorByWeight(visLink.weight),
            this.visConfig.path.opacity)
        })
        const otherVisLinks =
          _.differenceWith(
            this.visGraph.visLinks, focusedVisLinks, (aLink, bLink) => {
              return aLink.reference === bLink.reference &&
                aLink.citedBy === bLink.citedBy
            })
        const greyedOutVisLinks = _.map(otherVisLinks, visLink => {
          return new VisLink(
            visLink.reference,
            visLink.citedBy,
            visLink.weight,
            this.visConfig.path.greyedOutColor,
            this.visConfig.path.greyedOutOpacity)
        })
        const visLinks = [ ...greyedOutVisLinks, ...focusedVisLinks ]
        return visLinks
      }
    }
  },
  methods: {
    articleEdited (curr) {
      this.$emit('article-edited', curr)
    },
    async getArticleCardReferenceColor (articleId) {
      const isArticleIdInVisGraph = id => this.visGraph.getVisNode(id)
      const referenceIds = await theArticlePool.getReferenceIds(articleId)
      const nInGraphReferences =
        _.filter(referenceIds, isArticleIdInVisGraph).length
      return this.getCardSideColor(nInGraphReferences)
    },
    async getArticleCardCitedByColor (articleId) {
      const isArticleIdInVisGraph = id => this.visGraph.getVisNode(id)
      const citedByIds = await theArticlePool.getCitedByIds(articleId)
      const nInGraphCitedBys =
        _.filter(citedByIds, isArticleIdInVisGraph).length
      return this.getCardSideColor(nInGraphCitedBys)
    },
    getCardBackgroundColor (visNode) {
      return _.includes(this.selectedVisNodes, visNode)
        ? this.visConfig.cardSelectedBackgroundColor
        : undefined
    },
    getCardClasses (visNode) {
      if (visNode === this.hoveringVisNode || this.isVisNodeSelected(visNode)) {
        return [ `elevation-${this.visConfig.hoveringCardElevation}` ]
      }
      return []
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
      const scalar = 1 - Math.exp(Math.log(1) - this.visConfig.card.sideDarkness * count)
      return interpolateColor(scalar)
    },
    getCardStyle (visNode) {
      return {
        cursor: 'pointer',
        opacity:
          this.isVisNodeFocused(visNode)
            ? 1.0
            : this.visConfig.cardGreyedOutOpacity,
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
          ({ node: visNode }) => visNode === link.reference)
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
          ({ node: visNode }) => visNode === link.citedBy)
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
      const verticalGaps = new Array(this.gridConfig.nVerticalGap)
      for (let iGap = 0; iGap < this.gridConfig.nVerticalGap; ++iGap) {
        const gapLinks =
          _.filter(
            verticalGapLinks,
            link => link.reference.col === iGap)
        const downLinks =
          _.filter(gapLinks, link => link.reference.row < link.citedBy.row)
        const sortedDownLinks = _.sortBy(downLinks, link => {
          return -(link.reference.row * this.gridConfig.nRow + link.citedBy.row)
        })
        const upLinks =
          _.filter(gapLinks, link => link.reference.row >= link.citedBy.row)
        const sortedUpLinks = _.sortBy(upLinks, link => {
          return (link.reference.row * this.gridConfig.nRow + link.citedBy.row)
        })
        const sortedGapLinks = [ ...sortedDownLinks, ...sortedUpLinks ]
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
    isVisNodeSelected (visNode) {
      return _.includes(this.selectedVisNodes, visNode)
    },
    isVisNodeFocused (visNode) {
      return this.focusedVisNodes.length === 0
        ? true
        : _.includes(this.focusedVisNodes, visNode)
    },
    onAddDrawerArticleToVis (artId) {
      this.$emit('add-to-vis', artId)
    },
    onDrawerArticleSelected (artId) {
      this.selectedVisNodes = []
      this.$router.push(`/parsevis/${artId}`)
    },
    onDrawerArticleUnselected () {
      this.$router.go(-1)
    },
    onCanvasClicked () {
      this.selectedVisNodes = []
    },
    onCardClicked (event, visNode) {
      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        // multiple selection
        if (this.isVisNodeSelected(visNode)) {
          this.selectedVisNodes = _.without(this.selectedVisNodes, visNode)
        } else {
          this.selectedVisNodes = _.union(this.selectedVisNodes, [ visNode ])
        }
        this.isDrawerOpenComputed = false
      } else {
        // single selection
        this.selectedVisNodes = [ visNode ]
        this.$router.push(`/parsevis/${visNode.articleId}`)
        this.isDrawerOpenComputed = true
      }
    },
    onCardMouseEnter (visNode) {
      clearTimeout(this.hoverLingerTimer)
      this.hoveringVisNode = visNode
    },
    onCardMouseLeave (visNode) {
      this.hoverLingerTimer =
        setTimeout(
          () => { this.hoveringVisNode = null }, this.visConfig.hoverLinger)
    },
    onDrawerListItemTitleClicked (artId) {
      this.$router.push(`/parsevis/${artId}`)
    },
    trace (value) {
      console.log(value)
      return value
    }
  },
  watch: {
    drawerPageQuery: {
      immediate: true,
      handler (curr) {
        if (curr) {
          this.isDrawerOpenComputed = true
          this.selectedVisNodes = []
          this.selectedDrawerArticleId = null
        }
      }
    },
    visGraph (curr, prev) {
      const articleIds =
        _.map(this.selectedVisNodes, visNode => visNode.articleId)
      this.selectedVisNodes =
        _.filter(_.map(articleIds, id => curr.getVisNode(id)))
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
