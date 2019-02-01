<template>
  <v-app>
    <v-navigation-drawer stateless hide-overlay app v-model="isDrawerVisible" width=600 style="overflow: scroll; padding: 0px;">
      <v-toolbar flat>
        <v-text-field hide-details single-line clearable solo
          placeholder="search paper name"
          v-bind:loading="isSearching"
          v-on:keyup.native="searchKeyUp($event, searchText)"
          v-model="searchText">
        </v-text-field>
        <v-btn icon v-bind:loading="isSearching" v-on:click="search(searchText)">
          <v-icon>search</v-icon>
        </v-btn>
      </v-toolbar>
      <paper-detail v-show="drawerComponent === 'paper-detail'"
        ref="paperDetail"
        @populate="searchResultPopulate($event)"
        @insert="searchResultInsert($event)"
        @detail="showPaperDetail($event)"
        @back="drawerComponent = 'search-results'">
      </paper-detail>
      <search-results v-show="drawerComponent === 'search-results'"
        ref="searchResults"
        @populate="searchResultPopulate($event)"
        @insert="searchResultInsert($event)"
        @detail="showPaperDetail($event)">
      </search-results>
      <common-relatives v-show="drawerComponent === 'common-relatives'"
        ref="commonRelatives"
        @populate="searchResultPopulate($event)"
        @insert="searchResultInsert($event)"
        @detail="showPaperDetail($event)">
      </common-relatives>
    </v-navigation-drawer>
    <v-toolbar app>
      <v-toolbar-side-icon v-on:click="isDrawerVisible = !isDrawerVisible">
      </v-toolbar-side-icon>
      <v-toolbar-title>{{ title }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-tooltip v-if="graph.isAnyNodeSelected" bottom>
        <v-btn icon color="orange" slot="activator" @click="findCommonRelatives">
          <v-icon color="white">device_hub</v-icon>
        </v-btn>
        <span>Find common ancestors/descendants</span>
      </v-tooltip>
      <v-menu open-on-hover offset-y close-delay=0>
        <v-btn icon slot="activator"><v-icon>settings</v-icon></v-btn>
        <v-list>
          <v-list-tile>
            <v-list-tile-title>
              spring {{ fdeb.springConstant }}
            </v-list-tile-title>
            <v-list-tile-action>
              <v-slider v-model="computedSpringConstant" min="1" max="50000">
              </v-slider>
            </v-list-tile-action>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-title>
              electrostatic {{ fdeb.electroConstant }}
            </v-list-tile-title>
            <v-slider v-model="computedElectroConstant" min="1" max="1000">
            </v-slider>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-title>
              segments {{ fdeb.nSegmentsPerEdge }}
            </v-list-tile-title>
            <v-slider v-model="computedNEdgeSegments" min="2" max="32">
            </v-slider>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-title>
              force ratio {{ fdeb.forceConstant.toFixed(4) }}
            </v-list-tile-title>
            <v-slider v-model="computedForceConstant" min="1" max="1000"></v-slider>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-title>interval {{ fdeb.interval }}</v-list-tile-title>
            <v-slider v-model="computedEdgeInterval" min="10" max="1000"></v-slider>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-title>
              compatibility threshold {{ fdeb.compatibleThreshold.toFixed(2) }}
            </v-list-tile-title>
            <v-slider v-model="computedCompatibilityThreshold" min="0" max="1000"></v-slider>
          </v-list-tile>
        </v-list>
      </v-menu>
      <v-menu open-on-hover offset-y close-delay=0>
        <v-btn icon slot="activator"><v-icon>gesture</v-icon></v-btn>
        <v-list>
          <v-list-tile v-on:click="computedShowLinkMethod = 'show-link-hover'">
            <v-list-tile-title>show links on hover</v-list-tile-title>
          </v-list-tile>
          <v-list-tile v-on:click="computedShowLinkMethod = 'show-link-click'">
            <v-list-tile-title>toggle links on click</v-list-tile-title>
          </v-list-tile>
          <v-list-tile v-on:click="computedShowLinkMethod = 'show-link-all'">
            <v-list-tile-title>show all links</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="computedShowLinkMethod = 'show-link-between'">
            <v-list-tile-title>show link between columns</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>
      <v-menu open-on-hover offset-y close-delay=0>
        <v-btn icon slot="activator"><v-icon>dashboard</v-icon></v-btn>
        <v-list>
          <v-list-tile v-on:click="computedLayoutMethod = 'layout-by-year'">
            <v-list-tile-title>layout by year</v-list-tile-title>
          </v-list-tile>
          <v-list-tile v-on:click="computedLayoutMethod = 'layout-by-reference-level'">
            <v-list-tile-title>layout by reference level</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="computedLayoutMethod = 'layout-by-cite-level'">
            <v-list-tile-title>layout by citation level</v-list-tile-title>
          </v-list-tile>
          <v-list-tile v-on:click="computedLayoutMethod = 'layout-by-optimized'">
            <v-list-tile-title>layout hybrid</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>
      <v-menu open-on-hover offset-y close-delay=0>
        <v-btn icon slot="activator"><v-icon>credit_card</v-icon></v-btn>
        <v-list>
          <v-list-tile @click="computedPaperStyle ='paper-style-card'">
            <v-list-tile-title>card with more info</v-list-tile-title>
          </v-list-tile>
          <v-list-tile @click="computedPaperStyle ='paper-style-chip'">
            <v-list-tile-title>chip with minimal info</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>
      <v-btn icon @click="clearGraph"><v-icon>crop_landscape</v-icon></v-btn>
      <v-btn icon to="/contail"><v-icon>data_usage</v-icon></v-btn>
      <v-btn icon><v-icon>account_circle</v-icon></v-btn>
    </v-toolbar>
    <v-content app>
      <v-container ref="kanbanContainer" fluid class="kanban-container"
        @mousedown="deselectAllNodes">
        <div ref="yearsContainer" class="years-container"
          :style="`margin: 5px -${cardSpacing / 2}px;`">
          <span
            v-for="(yearInterval, index) in yearIntervalLabels" v-bind:key="index"
            v-bind:style="yearIntervalStyle" class="year-range">
            <h2 class="subheading">{{ yearInterval }}</h2>
          </span>
        </div>
        <div ref="graphContainer" class="graph-container"
          @scroll="alsoScrollYearsContainer">
          <svg class="overlay">
            <path v-for="(curve, index) in edges" :key="index" :d="curve.path"
              :stroke-width="curve.width || 1" :stroke-opacity="curve.opacity || 0.8" :stroke="curve.color || '#a55'">
            </path>
          </svg>
          <div class="cards-container" ref="cardsContainer">
            <paper-card
              ref="paperCards"
              :paperStyle="computedPaperStyle === 'paper-style-chip' ? 'chip' : 'card'"
              v-for="card in cards" v-bind:key="card.index"
              v-bind:card="card"
              v-on:update:card="updateCard($event)"
              v-on:mouseoverrefcount="handleMouseOverRefCount($event)"
              v-on:mouseoutrefcount="handleMouseOutRefCount($event)"
              v-on:clickrefcount="handleClickRefCount($event)"
              v-on:mouseovercitecount="handleMouseOverCiteCount($event)"
              v-on:mouseoutcitecount="handleMouseOutCiteCount($event)"
              v-on:clickcitecount="handleClickCiteCount($event)"
              v-on:clicktitle="handleClickTitle($event)"
              v-on:clickhandle="handleClickHandle($event)"
              v-on:remove="handleRemoveCard($event)"
              v-on:dragend="movePaperCard"></paper-card>
          </div>
        </div>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import PaperCard from './PaperCard.vue'
import PaperList from './PaperList.vue'
import PaperDetail from './PaperDetail.vue'
import SearchResults from './SearchResults.vue'
import CommonRelatives from './CommonRelatives.vue'
import { create as createRect } from './rect.js'
import { Graph } from './kanbangraph.js'
import { RiverGraph } from './rivergraph.js'
import FDEB from './forcedirectededgebundling.js'
import * as layout from './gridbasedlayout.js'
import * as api from './crossref.js'
import Vec from './vec.js'
import svg from './svgpath.js'
import _ from 'lodash'
import { interpolateBuPu as interpolateColor } from 'd3-scale-chromatic'

// TODO: consider using https://haltu.github.io/muuri/

export default {
  name: 'Kanban',
  components: {
    PaperCard,
    PaperList,
    PaperDetail,
    SearchResults,
    CommonRelatives
  },
  data () {
    this.$http.get('/api/static/insitupdf.json').then(function (res) {
      this.data = res.body
      this.paper = this.data.paper
      this.title = this.paper.title
      this.graph = Graph.fromTestJson({
        papers: this.data.references,
        relations: this.data.relations
      })
      this.cards = this.layoutByMethod(this.graph, this.layoutMethod)
      this.nextTickLayoutPaperCards()
    })
    this.colWidth = 180
    this.cardSpacing = 48
    this.cardVerticalSpacing = 10
    this.marginLeft = 24
    this.fdeb = new FDEB((edgePts) => { this.edgePts = edgePts })
    this.edgeThickness = 1.5
    this.edgeSpacing = 1.5
    this.horizontalEdgeElevation = 0.2
    this.orthoEdgeArcRadius = 1.5 * this.cardVerticalSpacing
    return {
      graph: {
        nodes: []
      },
      title: 'Papers',
      paper: {},
      cards: [],
      visibleRelations: [],
      visiblePaperRefLinks: [],
      visiblePaperCiteLinks: [],
      layoutMethod: 'layout-by-cite-level',
      showLinkMethod: 'show-link-hover',
      paperStyle: 'paper-style-chip',
      isDrawerVisible: false,
      searchText: '',
      isSearching: false,
      drawerComponent: 'search-results',
      edgePts: [],
      edgeLayout: 'river',
      riverWidthMode: 'river-width-constant'
    }
  },
  watch: {
    visiblePaperRefLinks: function (curr, prev) {
      this.showLinks(this.getVisibleLinks(curr, this.visiblePaperCiteLinks))
    },
    visiblePaperCiteLinks: function (curr, prev) {
      this.showLinks(this.getVisibleLinks(this.visiblePaperRefLinks, curr))
    }
  },
  computed: {
    curves: function () {
      return this.visibleRelations.map(relation => this.makeCurve(relation))
    },
    fdebPaths: function () {
      return _.map(this.edgePts, pts => {
        const firstPt = `M ${pts[0].x} ${pts[0].y}`
        const otherPts = _.map(_.slice(pts, 1), pt => {
          return `L ${pt.x} ${pt.y}`
        })
        const ptStrs = _.concat([ firstPt ], otherPts)
        return {
          path: _.join(ptStrs, ' ')
        }
      })
    },
    riverPaths: function () {
      const riverGraph =
        RiverGraph.buildFromRelations(this.graph, this.visibleRelations)
      const getRiverWidths = (connections, thickness) => {
        if (this.riverWidthMode === 'river-width-constant') {
          return _.map(connections, () => thickness)
        } else if (this.riverWidthMode === 'river-width-by-weight') {
          return _.map(connections, conn => conn.weight * thickness)
        }
      }
      const getColors = (connections) => {
        return _.map(connections, ({ weight }) => {
          const scalar = 1 - Math.exp(Math.log(1) - 0.35 * weight)
          return interpolateColor(scalar)
        })
      }
      return this.makeCurves(
        riverGraph,
        node => node.paperId,
        node => node.citedBys,
        node => node.citings,
        conn => conn.paperId,
        conn => conn.weight,
        getRiverWidths,
        getColors)
    },
    highwayPaths: function () {
      const getWidths = (conns, thickness) => _.map(conns, () => thickness)
      const getColors = conns => _.map(conns, () => interpolateColor(0.5))
      return this.makeCurves(
        this.graph,
        node => node.paper.id,
        node => node.inGraphCitedBys,
        node => node.inGraphCitings,
        conn => conn,
        conn => 1,
        getWidths,
        getColors)
    },
    edges: function () {
      return this.edgeLayout === 'force-directed-edge-bundling'
        ? this.fdebPaths
        : this.edgeLayout === 'curves'
          ? this.curves
          : this.edgeLayout === 'river'
            ? this.riverPaths
            : this.edgeLayout === 'highway'
              ? this.highwayPaths
              : []
    },
    yearIntervalLabels: function () {
      const colRows = this.cards.map(node => node.colRow)
      const grid = layout.toPaperGrid(colRows)
      const yearIntervals = grid.map(column => {
        const colPapers =
          column.map(paperIndex => this.graph.nodes[paperIndex].paper)
        const colYears = colPapers.map(paper => paper.year)
        return colYears.reduce((interval, year) => ({
          min: Math.min(year, interval.min),
          max: Math.max(year, interval.max)
        }), {
          min: Number.MAX_SAFE_INTEGER,
          max: Number.MIN_SAFE_INTEGER
        })
      })
      return yearIntervals.map(interval => {
        if (interval.min === interval.max) {
          return `${interval.min}`
        }
        return `${interval.min} to ${interval.max}`
      })
    },
    yearIntervalStyle: function () {
      return {
        display: 'inline-block',
        width: this.colWidth + 'px',
        'margin-left': this.cardSpacing / 2 + 'px',
        'margin-right': this.cardSpacing / 2 + 'px'
      }
    },
    topCardRect: function () {
      for (let iCard = 0; iCard < this.cards.length; ++iCard) {
        const card = this.cards[iCard]
        if (card.colRow.row === 0) {
          return card.rect
        }
      }
    },
    cardColRows: function () {
      return _.map(this.cards, card => card.colRow)
    },
    cardColRowsByPaperId: function () {
      const byId = {}
      _.forEach(this.cards, card => {
        byId[card.paper.id] = card.colRow
      })
      return byId
    },
    maxCardCol: function () {
      return _.max(_.map(this.cardColRows, colRow => colRow.col))
    },
    maxCardRow: function () {
      return _.max(_.map(this.cardColRows, colRow => colRow.row))
    },
    computedLayoutMethod: {
      get: function () {
        return this.layoutMethod
      },
      set: function (method) {
        this.layoutMethod = method
        this.cards = this.layoutByMethod(this.graph, method)
      }
    },
    computedShowLinkMethod: {
      get: function () {
        return this.showLinkMethod
      },
      set: function (method) {
        this.showLinkMethod = method
        if (method === 'show-link-all') {
          this.showLinks(this.graph.relations)
        } else if (method === 'show-link-between') {
          const relations =
            this.getRelationsBetweenColumns(this.cards, this.graph)
          this.showLinks(relations)
        } else {
          this.visiblePaperRefLinks = []
          this.visiblePaperCiteLinks = []
          this.showLinks([])
        }
      }
    },
    computedPaperStyle: {
      get: function () {
        return this.paperStyle
      },
      set: function (style) {
        this.paperStyle = style
        if (style === 'paper-style-chip') {
          this.colWidth = 180
          this.cardSpacing = 48
          this.cardVerticalSpacing = 10
        } else if (style === 'paper-style-card') {
          this.colWidth = 250
          this.cardSpacing = 24
          this.cardVerticalSpacing = 24
        }
        this.nextTickLayoutPaperCards()
      }
    },
    computedSpringConstant: {
      get: function () {
        return this.fdeb.springConstant
      },
      set: function (value) {
        this.fdeb.setSpringConstant(value)
      }
    },
    computedElectroConstant: {
      get: function () {
        return this.fdeb.electroConstant
      },
      set: function (value) {
        this.fdeb.setElectroConstant(value)
      }
    },
    computedNEdgeSegments: {
      get: function () {
        return this.fdeb.nSegmentsPerEdge
      },
      set: function (value) {
        this.fdeb.setNSegmentsPerEdge(value)
      }
    },
    computedForceConstant: {
      get: function () {
        return (this.fdeb.forceConstant - 0.001) / (0.01 - 0.001) * (1000 - 1) + 1
      },
      set: function (value) {
        this.fdeb.setForceConstant((value - 1) / (1000 - 1) * (0.01 - 0.001) + 0.001)
      }
    },
    computedEdgeInterval: {
      get: function () {
        return this.fdeb.interval
      },
      set: function (value) {
        this.fdeb.setInterval(value)
      }
    },
    computedCompatibilityThreshold: {
      get: function () {
        return this.fdeb.compatibleThreshold * 1000
      },
      set: function (value) {
        this.fdeb.setCompatibleThreshold(value / 1000)
      }
    }
  },
  methods: {
    search: function (text) {
      this.drawerComponent = 'search-results'
      this.isSearching = true
      this.$refs.searchResults.setSearchText(text).then(() => {
        this.isSearching = false
      }).catch(() => {
        this.isSearching = false
      })
    },
    searchKeyUp: function (event, text) {
      if (event.key === 'Enter') {
        this.search(text)
      }
    },
    searchResultPopulate: function (paper) {
      this.paper = paper
      const dois =
        _.filter(
          _.map(this.paper.references, ref => ref.doi), doi => !_.isEmpty(doi))
      const promises =
        dois.map(doi => api.getPaperByDOI(doi))
      Promise.all(promises).then(objects => {
        const papers = objects.filter(obj => obj !== null)
        this.graph = Graph.fromPapers(papers)
        this.cards = this.layoutByMethod(this.graph, this.layoutMethod)
        this.nextTickLayoutPaperCards()
      })
    },
    searchResultInsert: function (paper) {
      if (this.graph.includes(paper)) {
        return
      }
      const node = this.graph.insert(paper)
      const index = _.indexOf(this.graph.nodes, node)
      // TODO: insert paper without applying a specific layout
      this.cards = this.layoutByMethod(this.graph, this.layoutMethod)
      this.nextTickLayoutPaperCards().then(() => {
        const component =
          _.find(
            this.$refs.paperCards, paperCard => paperCard.card.index === index)
        component.$el.scrollIntoView({ behavior: 'smooth' })
      })
    },
    showPaperDetail: function (paper) {
      this.drawerComponent = 'paper-detail'
      this.$refs.paperDetail.setPaper(paper)
    },
    findCommonRelatives: function () {
      const papers = _.map(this.graph.selectedNodes, node => node.paper)
      this.isDrawerVisible = true
      this.drawerComponent = 'common-relatives'
      this.$refs.commonRelatives.setPapers(papers)
    },
    deselectAllNodes: function () {
      this.graph.deselectAllNodes()
      this.nextTickLayoutPaperCards()
    },
    clearGraph: function () {
      this.graph.clear()
      this.cards = []
    },
    handleMouseOverRefCount: function (paperId) {
      if (this.showLinkMethod === 'show-link-hover') {
        this.visiblePaperRefLinks =
          _.union(this.visiblePaperRefLinks, [ paperId ])
      }
    },
    handleMouseOutRefCount: function (paperId) {
      if (this.showLinkMethod === 'show-link-hover') {
        this.visiblePaperRefLinks =
          _.without(this.visiblePaperRefLinks, paperId)
      }
    },
    handleClickRefCount: function (paperId) {
      if (this.showLinkMethod === 'show-link-click') {
        if (_.includes(this.visiblePaperRefLinks, paperId)) {
          this.visiblePaperRefLinks =
            _.without(this.visiblePaperRefLinks, paperId)
        } else {
          this.visiblePaperRefLinks =
            _.union(this.visiblePaperRefLinks, [ paperId ])
        }
      }
    },
    handleMouseOverCiteCount: function (paperId) {
      if (this.showLinkMethod === 'show-link-hover') {
        this.visiblePaperCiteLinks =
          _.union(this.visiblePaperCiteLinks, [ paperId ])
      }
    },
    handleMouseOutCiteCount: function (paperId) {
      if (this.showLinkMethod === 'show-link-hover') {
        this.visiblePaperCiteLinks =
          _.without(this.visiblePaperCiteLinks, paperId)
      }
    },
    handleClickCiteCount: function (paperId) {
      if (this.showLinkMethod === 'show-link-click') {
        if (_.includes(this.visiblePaperCiteLinks, paperId)) {
          this.visiblePaperCiteLinks =
            _.without(this.visiblePaperCiteLinks, paperId)
        } else {
          this.visiblePaperCiteLinks =
            _.union(this.visiblePaperCiteLinks, [ paperId ])
        }
      }
    },
    handleClickTitle: function (paperIndex) {
      this.isDrawerVisible = true
      this.showPaperDetail(this.graph.nodes[paperIndex].paper)
    },
    handleClickHandle: function (paperIndex) {
      this.graph.toggleSelectedByIndex(paperIndex)
      const colRows = this.cards.map(node => node.colRow)
      this.cards = this.getCardsByColRows(this.graph, colRows)
      this.updateEdges()
    },
    handleRemoveCard: function (paperIndex) {
      this.graph.remove(paperIndex)
      this.cards = this.layoutByMethod(this.graph, this.layoutMethod)
      this.updateEdges()
    },
    alsoScrollYearsContainer: function (evt) {
      this.$refs.yearsContainer.scrollLeft = this.$refs.graphContainer.scrollLeft
    },
    getRelationsBetweenColumns: function (cards, graph) {
      const relations = _.filter(graph.relations, relation => {
        const citingId = relation.citing
        const citedById = relation.citedBy
        const citingIndex =
          _.findIndex(graph.nodes, node => node.paper.id === citingId)
        const citedByIndex =
          _.findIndex(graph.nodes, node => node.paper.id === citedById)
        const citingCol = cards[citingIndex].colRow.col
        const citedByCol = cards[citedByIndex].colRow.col
        return citingCol === citedByCol - 1
      })
      return relations
    },
    showLinks: function (relations) {
      this.visibleRelations = relations
      this.updateEdges()
    },
    getVisibleLinks: function (paperRefLinks, paperCiteLinks) {
      return this.graph.getUnionRelations(paperCiteLinks, paperRefLinks)
    },
    movePaperCard: function (node, evt) {
      const oldColRows = this.cards.map(card => card.colRow)
      const newColRow = this.getColRowByRect(this.cards, node.rect)
      const newColRows = layout.moveColRow(oldColRows, node.index, newColRow)
      this.cards = this.getCardsByColRows(this.graph, newColRows)
      this.updateEdges()
    },
    layoutByMethod: function (graph, method) {
      if (this.layoutMethod === 'layout-by-year') {
        return this.layoutByYears(graph)
      } else if (this.layoutMethod === 'layout-by-reference-level') {
        return this.layoutByRefLevel(graph)
      } else if (this.layoutMethod === 'layout-by-cite-level') {
        return this.layoutByCiteLevel(graph)
      } else if (this.layoutMethod === 'layout-by-optimized') {
        return this.layoutByOptimized(graph)
      }
      throw new Error(`wrong layout method ${method}`)
    },
    layoutByYears: function (graph) {
      const colRows = layout.getColRowsByYears(graph)
      return this.getCardsByColRows(graph, colRows)
    },
    layoutByRefLevel: function (graph) {
      const colRows = layout.getColRowsByCitedLevels(graph)
      return this.getCardsByColRows(graph, colRows)
    },
    layoutByCiteLevel: function (graph) {
      const colRows = layout.getColRowsByCitingLevels(graph)
      return this.getCardsByColRows(graph, colRows)
    },
    layoutByOptimized: function (graph) {
      const colRows = layout.getColRowsByOptimalYearIntervals(graph)
      return this.getCardsByColRows(graph, colRows)
    },
    getCardsByColRows: function (graph, colRows) {
      const grid = layout.toPaperGrid(colRows)
      let cards = []
      grid.forEach((column, iCol) => {
        let top = 0
        column.forEach((paperId, iRow) => {
          const graphNode = graph.nodes[paperId]
          const cardHeight = graphNode.geometry.height
          cards[paperId] = {
            ...graphNode,
            index: paperId,
            colRow: { col: iCol, row: iRow },
            rect: createRect({
              left: iCol * (this.colWidth + this.cardSpacing),
              top: top,
              width: this.colWidth,
              height: cardHeight
            })
          }
          top += cardHeight + this.cardVerticalSpacing
        })
      })
      return cards
    },
    getColRowByRect: function (cards, rect) {
      const col = Math.floor((rect.center.x + 0.5 * this.cardSpacing) / (this.colWidth + this.cardSpacing))
      const colRows = cards.map(node => node.colRow)
      const grid = layout.toPaperGrid(colRows)
      const column = grid[col]
      const colHeights = column.map(paperId => this.graph.nodes[paperId].geometry.height)
      const colCenterYs = colHeights.reduce((centerYs, height) => {
        if (centerYs.length === 0) {
          centerYs.push(height / 2)
        } else {
          const lastCenterY = centerYs[centerYs.length - 1]
          centerYs.push(lastCenterY + this.cardVerticalSpacing + height)
        }
        return centerYs
      }, [])
      if (rect.center.y <= colHeights[0]) {
        return { col: col, row: 0 }
      }
      let row = 0
      for (; row < colCenterYs.length - 1; ++row) {
        const upperCenterY = colCenterYs[row]
        const lowerCenterY = colCenterYs[row + 1]
        if (upperCenterY <= rect.center.y && rect.center.y < lowerCenterY) {
          break
        }
      }
      return {
        col: col,
        row: row + 1
      }
    },
    updateCard: function (card) {
      this.$set(this.cards, card.index, card)
    },
    nextTickLayoutPaperCards: function () {
      return this.$nextTick().then(() => {
        this.updateGeos()
        const colRows = this.cards.map(_.property('colRow'))
        this.cards = this.getCardsByColRows(this.graph, colRows)
        this.updateEdges()
      })
    },
    updateGeos: function () {
      this.$refs.paperCards.forEach(component => {
        this.graph.nodes[component.card.index].geometry = {
          height: component.$el.clientHeight,
          headerHeight: component.$refs.header.clientHeight || component.$refs.header.computedHeight
        }
      })
    },
    makeCurve: function (relation) {
      let citedBy =
        _.find(this.cards, card => card.paper.id === relation.citedBy)
      let citing =
        _.find(this.cards, card => card.paper.id === relation.citing)
      const start = {
        x: citedBy.rect.left + this.marginLeft,
        y: citedBy.rect.top + this.graph.getNodeById(relation.citedBy).geometry.headerHeight / 2
      }
      const end = {
        x: citing.rect.right + this.marginLeft,
        y: citing.rect.top + this.graph.getNodeById(relation.citing).geometry.headerHeight / 2
      }
      return {
        path: svg.makeRatioCurve(start, end, 0.5)
      }
    },
    updateEdges: function () {
      const marginLeft = this.marginLeft
      const edgeEndPts = this.visibleRelations.map((relation, index) => {
        let citedBy =
          _.find(this.cards, card => card.paper.id === relation.citedBy)
        let citing =
          _.find(this.cards, card => card.paper.id === relation.citing)
        const beg = {
          x: citedBy.rect.left + marginLeft,
          y: citedBy.rect.top + this.graph.getNodeById(relation.citedBy).geometry.headerHeight / 2
        }
        const end = {
          x: citing.rect.right + marginLeft,
          y: citing.rect.top + this.graph.getNodeById(relation.citing).geometry.headerHeight / 2
        }
        return { beg, end }
      })
      this.fdeb.edgeEndPts = edgeEndPts
    },
    getVerticalGapHighways: function (relations) {
      const colRowsById = this.cardColRowsByPaperId
      let maxCardCol = this.maxCardCol
      let maxCardRow = this.maxCardRow
      const highways = []
      for (let col = 0; col < maxCardCol - 1; ++col) {
        const gapRelations = _.map(relations, (relation, index) => ({
          index: index,
          citedBy: {
            paperId: relation.citedBy,
            colRow: colRowsById[relation.citedBy]
          },
          citing: {
            paperId: relation.citing,
            colRow: colRowsById[relation.citing]
          }
        }))
        const colRelations = _.filter(gapRelations, (relation) => {
          const citedByColRow = relation.citedBy.colRow
          const citingColRow = relation.citing.colRow
          return citingColRow.col === col && citedByColRow.col === col + 1
        })
        const sortedColRelations = _.sortBy(colRelations, (relation) => {
          return -(relation.citing.colRow.row * (maxCardRow + 1) + relation.citedBy.colRow.row)
        })
        _.forEach(sortedColRelations, (relation) => {
          const minRow =
            Math.min(relation.citedBy.colRow.row, relation.citing.colRow.row)
          const maxRow =
            Math.max(relation.citedBy.colRow.row, relation.citing.colRow.row)
          for (let row = minRow; row < maxRow; ++row) {
            highways[col] = highways[col] || []
            highways[col][row] = highways[col][row] || []
            highways[col][row].push(relation.index)
          }
        })
      }
      return highways
    },
    getNodeInfos: function (graph, getNodePaperId, getInGraphCitedBys, getInGraphCitings, getConnPaperId, getConnWeight, getWidths, getColors) {
      const thickness = this.edgeThickness
      const spacing = this.edgeSpacing
      const nodeInfos = {}
      _.forEach(graph.nodes, node => {
        const card =
          _.find(this.cards, card => card.paper.id === getNodePaperId(node))
        const sortedCitedBys = _.map(
          _.sortBy(getInGraphCitedBys(node), citedBy => {
            const citedById = getConnPaperId(citedBy)
            const citedByCard =
              _.find(this.cards, card => card.paper.id === citedById)
            const x = citedByCard.rect.left - card.rect.right
            const y = citedByCard.rect.top - card.rect.top
            return y / x
          }),
          conn => ({
            paperId: getConnPaperId(conn),
            weight: getConnWeight(conn)
          }))
        const sortedCitings = _.map(
          _.sortBy(getInGraphCitings(node), citing => {
            const citingCard =
              _.find(
                this.cards, card => card.paper.id === getConnPaperId(citing))
            const x = citingCard.rect.right - card.rect.left
            const y = citingCard.rect.top - card.rect.top
            return -y / x
          }),
          conn => ({
            paperId: getConnPaperId(conn),
            weight: getConnWeight(conn)
          }))
        const nCitedBy = getInGraphCitedBys(node).length
        const nCiting = getInGraphCitings(node).length
        const citedByColors = getColors(sortedCitedBys)
        const citingColors = getColors(sortedCitings)
        const citedByWidths = getWidths(sortedCitedBys, thickness)
        const citingWidths = getWidths(sortedCitings, thickness)
        const citedByRunningWidths = prefixSum(citedByWidths, spacing)
        const citingRunningWidths = prefixSum(citingWidths, spacing)
        const citedByWidth = _.last(citedByRunningWidths) + nCitedBy * spacing
        const citingWidth = _.last(citingRunningWidths) + nCiting * spacing
        const citedByYOffsets = _.map(sortedCitedBys, (citedBy, index) => {
          return -citedByWidth / 2 + citedByRunningWidths[index] + index * spacing + 0.5 * citedByWidths[index]
        })
        const citingYOffsets = _.map(sortedCitings, (citing, index) => {
          return -citingWidth / 2 + citingRunningWidths[index] + index * spacing + 0.5 * citingWidths[index]
        })
        const citedByEndPts = _.map(citedByYOffsets, yOffset => {
          return {
            x: card.rect.right + this.marginLeft,
            y: card.rect.top + this.graph.getNodeById(getNodePaperId(node)).geometry.headerHeight / 2 + yOffset
          }
        })
        const citingEndPts = _.map(citingYOffsets, yOffset => {
          return {
            x: card.rect.left + this.marginLeft,
            y: card.rect.top + this.graph.getNodeById(getNodePaperId(node)).geometry.headerHeight / 2 + yOffset
          }
        })
        const citedByColRows =
          _.map(
            sortedCitedBys, info => this.cardColRowsByPaperId[info.paperId])
        const citingColRows =
          _.map(
            sortedCitings, info => this.cardColRowsByPaperId[info.paperId])
        const zipInfo =
          (infos, endPts, widths, colors, colRows) => _.zipWith(
            infos, endPts, widths, colors, colRows,
            (citedBy, endPt, width, color, colRow) => ({
              ...citedBy, endPt, width, color, colRow
            }))
        const toInfoObj = infos => {
          return _.reduce(infos, (obj, info) => {
            obj[info.paperId] = info
            return obj
          }, {})
        }
        const citedByInfo =
          toInfoObj(
            zipInfo(
              sortedCitedBys, citedByEndPts, citedByWidths, citedByColors,
              citedByColRows))
        const citingInfo =
          toInfoObj(
            zipInfo(
              sortedCitings, citingEndPts, citingWidths, citingColors,
              citingColRows))
        nodeInfos[getNodePaperId(node)] = {
          citedBys: citedByInfo,
          citings: citingInfo,
          colRow: this.cardColRowsByPaperId[getNodePaperId(node)],
          paperId: getNodePaperId(node)
        }
      })
      return nodeInfos
    },
    getRelationInfos: function (relations, nodeInfos, highways) {
      return _.map(relations, (relation, index) => {
        const citedById = relation.citedBy
        const citingId = relation.citing
        const citedByInfo = nodeInfos[citedById]
        const citingInfo = nodeInfos[citingId]
        const citingColRow = citingInfo.colRow
        const lanes = { gapIndex: citingColRow.col }
        _.forEach(highways[lanes.gapIndex], (currLanes, row) => {
          const iLane = _.indexOf(currLanes, index)
          if (iLane >= 0) {
            lanes[row] = {
              laneIndex: iLane,
              totalLane: currLanes.length
            }
          }
        })
        return {
          citedBy: citedByInfo,
          citing: citingInfo,
          lanes: { ...lanes },
          weight: relation.weight
        }
      })
    },
    makeCurves: function (graph, getNodePaperId, getInGraphCitedBys, getInGraphCitings, getConnPaperId, getConnWeight, getWidths, getColors) {
      const nodeInfos =
        this.getNodeInfos(
          graph, getNodePaperId, getInGraphCitedBys, getInGraphCitings,
          getConnPaperId, getConnWeight, getWidths, getColors)
      const highways = this.getVerticalGapHighways(graph.relations)
      const relationInfos =
        this.getRelationInfos(graph.relations, nodeInfos, highways)
      return _.map(relationInfos, relationInfo => {
        const citedById = relationInfo.citedBy.paperId
        const citingId = relationInfo.citing.paperId
        const citedByInfo = relationInfo.citedBy.citings[citingId]
        const citingInfo = relationInfo.citing.citedBys[citedById]
        const citedByColRow = relationInfo.citedBy.colRow
        const citingColRow = relationInfo.citing.colRow
        const laneInfo = relationInfo.lanes
        const isNeighborColumnRelation =
          info => Math.abs(citedByInfo.colRow.col - citingInfo.colRow.col) === 1
        const isSameRowRelation = info => citedByColRow.row === citingColRow.row
        const pathData =
          isNeighborColumnRelation(relationInfo)
            ? isSameRowRelation(relationInfo)
              ? svg.makeFixedCurve(
                citedByInfo.endPt, citingInfo.endPt, 0.15 * this.cardSpacing)
              : this.makeOrthoPath(citedByInfo, citingInfo, laneInfo)
            : isSameRowRelation(relationInfo)
              ? svg.makeElevatedCurve(
                citedByInfo.endPt, citingInfo.endPt, 0.3 * this.cardSpacing,
                this.horizontalEdgeElevation * this.topCardRect.height)
              : svg.makeFixedCurve(
                citedByInfo.endPt, citingInfo.endPt, 0.3 * this.cardSpacing)
        return {
          path: pathData,
          width: citedByInfo.width,
          color: citedByInfo.color
        }
      })
    },
    makeOrthoPath (citedByInfo, citingInfo, laneInfo) {
      const thickness = this.edgeThickness
      const spacing = this.edgeSpacing
      const citedByPt = citedByInfo.endPt
      const citingPt = citingInfo.endPt
      const mid = Vec.mid(citedByPt, citingPt)
      const signY =
        (citingPt.y - citedByPt.y) / Math.abs(citingPt.y - citedByPt.y) || 1
      const topY = this.topCardRect.center.y
      const segLen = this.topCardRect.height + this.cardVerticalSpacing
      const halfGap = this.cardVerticalSpacing
      const arcRadius = this.orthoEdgeArcRadius
      const citedByRow = citedByInfo.colRow.row
      const citingRow = citingInfo.colRow.row
      const minRow = Math.min(citedByRow, citingRow)
      const maxRow = Math.max(citedByRow, citingRow)
      const minPt = _.minBy([ citedByPt, citingPt ], pt => pt.y)
      const maxPt = _.maxBy([ citedByPt, citingPt ], pt => pt.y)
      const getLaneX = (lane, totalLane, midX, thickness) => {
        const leftMost =
          midX - 0.5 * (totalLane * thickness + (totalLane - 1) * spacing)
        return leftMost + lane * thickness + lane * spacing + 0.5 * thickness
      }
      const firstLaneX =
        getLaneX(
          laneInfo[minRow].laneIndex, laneInfo[minRow].totalLane, mid.x,
          thickness)
      const firstSegY = topY + (minRow + 1) * segLen - halfGap
      const minArcRadius = topY + minRow * segLen + arcRadius - minPt.y
      const signedMinArcRadius = minArcRadius * signY
      const lastLaneX =
        getLaneX(
          laneInfo[maxRow - 1].laneIndex, laneInfo[maxRow - 1].totalLane, mid.x,
          thickness)
      const maxArcRadius = maxPt.y - (topY + maxRow * segLen - arcRadius)
      const signedMaxArcRadius = maxArcRadius * signY
      let pathData = `M ${minPt.x} ${minPt.y}`
      pathData += ` L ${firstLaneX + signedMinArcRadius} ${minPt.y}` +
        ` Q ${firstLaneX} ${minPt.y} ${firstLaneX} ${minPt.y + minArcRadius}` +
        ` L ${firstLaneX} ${firstSegY}`
      for (let iSeg = minRow + 1; iSeg < maxRow; ++iSeg) {
        const prevLaneX =
          getLaneX(
            laneInfo[iSeg - 1].laneIndex, laneInfo[iSeg - 1].totalLane, mid.x,
            thickness)
        const prevSegY = topY + iSeg * segLen - halfGap
        const laneX =
          getLaneX(
            laneInfo[iSeg].laneIndex, laneInfo[iSeg].totalLane, mid.x,
            thickness)
        const minSegY = topY + iSeg * segLen + halfGap
        const maxSegY = topY + (iSeg + 1) * segLen - halfGap
        pathData += ` C ${prevLaneX} ${prevSegY + halfGap} ${laneX} ${minSegY - halfGap} ${laneX} ${minSegY}`
        if (iSeg === maxRow - 1) {
          pathData += ` L ${lastLaneX} ${maxPt.y - maxArcRadius}`
        } else {
          pathData += ` L ${laneX} ${maxSegY}`
        }
      }
      pathData += ` Q ${lastLaneX} ${maxPt.y} ${lastLaneX - signedMaxArcRadius} ${maxPt.y}`
      pathData += ` L ${maxPt.x} ${maxPt.y}`
      return pathData
    }
  }
}

function prefixSum (values, spacing = 0) {
  return _.reduce(values, (result, value) => {
    result = _.concat(result, value + _.last(result))
    return result
  }, [ 0 ])
}

</script>

<style scoped>

.year-range {
  text-align: center;
}

.kanban-container {
  position: relative;
  height: 100%;
  white-space: nowrap;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-left: 0px;
  padding-right: 0px;
  padding-bottom: 0px;
}

.years-container {
  white-space: nowrap;
  overflow: hidden;
  padding-left: 24px;
  padding-right: 24px;
}

.graph-container {
  position: relative;
  white-space: nowrap;
  flex: 1;
  overflow-x: scroll;
  overflow-y: scroll;
  padding-left: 24px;
  padding-right: 24px;
}

.cards-container {
  position: relative;
}

.overlay {
  position: absolute;
  width: 100%;
  top:0px;
  bottom:0px;
  left:0px;
  right:0px;
  background: rgba(100,100,200,0);
  pointer-events: none;
  overflow: visible;
}

.overlay line {
  stroke: #55a;
  fill: none;
  stroke-width: 3px;
}

.overlay path {
  /*stroke: #a55;*/
  fill: none;
  /*stroke-opacity: 0.7;*/
  /*stroke-width: 2px;*/
}

.kanban {
  list-style: none;
  padding: 0;
}

.header {
  display: flex;
}
</style>
