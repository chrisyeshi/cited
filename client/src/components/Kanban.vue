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
            <v-list-tile-title>spring {{ globalSpringConstant }}</v-list-tile-title>
            <v-list-tile-action>
              <v-slider v-model="computedSpringConstant" min="1" max="50000"></v-slider>
            </v-list-tile-action>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-title>electrostatic {{ electroConstant }}</v-list-tile-title>
            <v-slider v-model="computedElectroConstant" min="1" max="1000"></v-slider>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-title>segments {{ nEdgeSegments }}</v-list-tile-title>
            <v-slider v-model="computedNEdgeSegments" min="2" max="32"></v-slider>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-title>force ratio {{ forceConstant.toFixed(4) }}</v-list-tile-title>
            <v-slider v-model="computedForceConstant" min="1" max="1000"></v-slider>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-title>interval {{ edgeInterval }}</v-list-tile-title>
            <v-slider v-model="computedEdgeInterval" min="10" max="1000"></v-slider>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-title>compatibility threshold {{ compatibilityThreshold.toFixed(2) }}</v-list-tile-title>
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
            <path v-for="(curve, index) in edges" :key="index" :d="curve.path"></path>
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
import * as layout from './gridbasedlayout.js'
import * as api from './crossref.js'
import _ from 'lodash'

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
    this.isMovingEdge = false
    this.edgeCompatibilityLists = []
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
      globalSpringConstant: 10000,
      electroConstant: 1,
      nEdgeSegments: 8,
      forceConstant: 0.001,
      edgeInterval: 200,
      compatibilityThreshold: 0.5
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
    links: function () {
      const marginLeft = 24
      return this.visibleRelations.map((relation, index) => {
        let citedBy = this.cards[relation.citedBy]
        let citing = this.cards[relation.citing]
        return {
          key: index,
          citedBy: {
            x: citedBy.rect.left + marginLeft,
            y: citedBy.rect.top + this.graph.getNodeById(relation.citedBy).geometry.headerHeight / 2
          },
          citing: {
            x: citing.rect.right + marginLeft,
            y: citing.rect.top + this.graph.getNodeById(relation.citing).geometry.headerHeight / 2
          }
        }
      })
    },
    curves: function () {
      const marginLeft = 24
      return this.visibleRelations.map((relation, index) => {
        let citedBy =
          _.find(this.cards, card => card.paper.id === relation.citedBy)
        let citing =
          _.find(this.cards, card => card.paper.id === relation.citing)
        const start = {
          x: citedBy.rect.left + marginLeft,
          y: citedBy.rect.top + this.graph.getNodeById(relation.citedBy).geometry.headerHeight / 2
        }
        const end = {
          x: citing.rect.right + marginLeft,
          y: citing.rect.top + this.graph.getNodeById(relation.citing).geometry.headerHeight / 2
        }
        const interpolate = (beg, end, ratio) => {
          return ratio * (end - beg) + beg
        }
        const ratio = 0.5
        return {
          key: index,
          path: `M${start.x} ${start.y} C ${interpolate(start.x, end.x, ratio)} ${start.y}, ${interpolate(end.x, start.x, ratio)} ${end.y}, ${end.x} ${end.y}`
        }
      })
    },
    edges: function () {
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
        return this.globalSpringConstant
      },
      set: function (value) {
        this.globalSpringConstant = value
        this.beginMoveEdges()
      }
    },
    computedElectroConstant: {
      get: function () {
        return this.electroConstant
      },
      set: function (value) {
        this.electroConstant = value
        this.beginMoveEdges()
      }
    },
    computedNEdgeSegments: {
      get: function () {
        return this.nEdgeSegments
      },
      set: function (value) {
        this.nEdgeSegments = value
        this.updateEdges()
      }
    },
    computedForceConstant: {
      get: function () {
        return (this.forceConstant - 0.001) / (0.01 - 0.001) * (1000 - 1) + 1
      },
      set: function (value) {
        this.forceConstant = (value - 1) / (1000 - 1) * (0.01 - 0.001) + 0.001
        this.beginMoveEdges()
      }
    },
    computedEdgeInterval: {
      get: function () {
        return this.edgeInterval
      },
      set: function (value) {
        this.edgeInterval = value
        this.beginMoveEdges()
      }
    },
    computedCompatibilityThreshold: {
      get: function () {
        return this.compatibilityThreshold * 1000
      },
      set: function (value) {
        this.compatibilityThreshold = value / 1000
        this.updateEdges()
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
    updateEdges: function () {
      const marginLeft = 24
      const nSegmentsPerEdge = this.nEdgeSegments
      const nPtsPerEdge = nSegmentsPerEdge + 1
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
      this.edgeCompatibilityLists = _.map(edgeEndPts, () => ([]))
      for (let iEdge = 0; iEdge < edgeEndPts.length; ++iEdge) {
        for (let jEdge = iEdge + 1; jEdge < edgeEndPts.length; ++jEdge) {
          const score =
            this.edgeCompatibility(edgeEndPts[iEdge], edgeEndPts[jEdge])
          if (score > this.compatibilityThreshold) {
            this.edgeCompatibilityLists[iEdge].push(jEdge)
            this.edgeCompatibilityLists[jEdge].push(iEdge)
          }
        }
      }
      const interpolate = (beg, end, ratio) => {
        return ratio * (end - beg) + beg
      }
      this.edgePts = _.map(edgeEndPts, ({ beg, end }) => {
        const pts = []
        pts[0] = beg
        pts[nPtsPerEdge - 1] = end
        for (let iPt = 1; iPt < nPtsPerEdge - 1; ++iPt) {
          const ratio = (iPt) / (nPtsPerEdge - 1)
          pts[iPt] = {
            x: interpolate(beg.x, end.x, ratio),
            y: interpolate(beg.y, end.y, ratio)
          }
        }
        return pts
      })
      this.beginMoveEdges()
    },
    beginMoveEdges: function () {
      if (this.isMovingEdge) {
        return
      }
      console.log('begin edge iteration')
      this.isMovingEdge = true
      this.moveEdges()
    },
    lengthEdge (edge) {
      return this.distancePt(edge.beg, edge.end)
    },
    lengthPt (pt) {
      return Math.sqrt(pt.x * pt.x + pt.y * pt.y)
    },
    distancePt (a, b) {
      return this.lengthPt(this.minusPt(b, a))
    },
    minusPt (a, b) {
      return { x: a.x - b.x, y: a.y - b.y }
    },
    plusPt (a, b) {
      return { x: a.x + b.x, y: a.y + b.y }
    },
    timesPt (pt, C) {
      return { x: pt.x * C, y: pt.y * C }
    },
    dotPt (a, b) {
      return a.x * b.x + a.y * b.y
    },
    moveEdges: function () {
      const nSegmentsPerEdge = this.nEdgeSegments
      const electroConstant = this.electroConstant
      const forceConstant = this.forceConstant
      const nPtsPerEdge = nSegmentsPerEdge + 1
      const forces = []
      for (let iEdge = 0; iEdge < this.edgePts.length; ++iEdge) {
        const thisPts = this.edgePts[iEdge]
        forces[iEdge] = forces[iEdge] || []
        forces[iEdge][0] = { x: 0, y: 0 }
        forces[iEdge][nPtsPerEdge - 1] = { x: 0, y: 0 }
        for (let iPt = 1; iPt < nPtsPerEdge - 1; ++iPt) {
          // spring force
          const thisLength =
            this.distancePt(thisPts[0], thisPts[thisPts.length - 1])
          const springConstant = this.globalSpringConstant / thisLength
          const frontDelta = this.minusPt(thisPts[iPt - 1], thisPts[iPt])
          const backDelta = this.minusPt(thisPts[iPt + 1], thisPts[iPt])
          const springForce = this.plusPt(frontDelta, backDelta)
          // electrostatic force
          let electroForce = { x: 0, y: 0 }
          _.forEach(this.edgeCompatibilityLists[iEdge], jEdge => {
            const thatPts = this.edgePts[jEdge]
            const delta = this.minusPt(thatPts[iPt], thisPts[iPt])
            electroForce = this.plusPt(electroForce, delta)
          })
          // for (let jEdge = 0; jEdge < this.edgePts.length; ++jEdge) {
          //   if (iEdge === jEdge) {
          //     continue
          //   }
          //   const thatPts = this.edgePts[jEdge]
          //   const delta = this.minusPt(thatPts[iPt], thisPts[iPt])
          //   electroForce = this.plusPt(electroForce, delta)
          // }
          // combined force
          forces[iEdge][iPt] =
            this.plusPt(
              this.timesPt(springForce, springConstant),
              this.timesPt(electroForce, electroConstant))
        }
      }
      // stop iteration if force is small enough
      const maxForce =
        _.max(
          _.map(
            _.flatten(forces),
            force => _.max([ Math.abs(force.x), Math.abs(force.y) ])))
      // console.log(maxForce)
      if (maxForce === undefined || maxForce < 100) {
        this.isMovingEdge = false
        console.log('stop edge iteration')
        return
      }
      // move points
      const newEdgePts = []
      for (let iEdge = 0; iEdge < this.edgePts.length; ++iEdge) {
        newEdgePts[iEdge] = newEdgePts[iEdge] || []
        newEdgePts[iEdge][0] = this.edgePts[iEdge][0]
        newEdgePts[iEdge][nPtsPerEdge - 1] =
          this.edgePts[iEdge][nPtsPerEdge - 1]
        for (let iPt = 1; iPt < nPtsPerEdge - 1; ++iPt) {
          newEdgePts[iEdge][iPt] =
            this.plusPt(
              this.edgePts[iEdge][iPt],
              this.timesPt(forces[iEdge][iPt], forceConstant))
        }
      }
      this.edgePts = newEdgePts
      setTimeout(this.moveEdges.bind(this), this.edgeInterval)
    },
    angleCompatibility (aEdge, bEdge) {
      const aVector = this.minusPt(aEdge.end, aEdge.beg)
      const bVector = this.minusPt(bEdge.end, bEdge.beg)
      const aLength = this.lengthEdge(aEdge)
      const bLength = this.lengthEdge(bEdge)
      const score = Math.abs(this.dotPt(aVector, bVector) / (aLength * bLength))
      return score
    },
    scaleCompatibility (aEdge, bEdge) {
      const aLength = this.lengthEdge(aEdge)
      const bLength = this.lengthEdge(bEdge)
      const avgLength = (aLength + bLength) / 2
      const score =
        2 / (avgLength / Math.min(aLength, bLength) + Math.max(aLength, bLength) / avgLength)
      // console.log('scale compatibility:', score)
      return score
    },
    positionCompatibility (aEdge, bEdge) {
      const aLength = this.lengthEdge(aEdge)
      const bLength = this.lengthEdge(bEdge)
      const avgLength = (aLength + bLength) / 2
      const aMid = this.timesPt(this.plusPt(aEdge.beg, aEdge.end), 0.5)
      const bMid = this.timesPt(this.plusPt(bEdge.beg, bEdge.end), 0.5)
      const score = avgLength / (avgLength + this.distancePt(aMid, bMid))
      // console.log('position compatibility: ', score)
      return score
    },
    visibilityCompatibility (aEdge, bEdge) {
      const projectPointOnLine = (pt, edge) => {
        const edgeLength = this.lengthEdge(edge)
        const ratio = ((edge.beg.y - pt.y) * (edge.beg.y - edge.end.y) - (edge.beg.x - pt.x) * (edge.end.x - edge.beg.x)) / (edgeLength * edgeLength)
        return this.plusPt(
          edge.beg, this.timesPt(this.minusPt(edge.end, edge.beg), ratio))
      }
      // const pt = projectPointOnLine(
      //   { x: 0.0, y: 1.5 },
      //   {
      //     beg: { x: 0.0, y: 0.0 },
      //     end: { x: 1.0, y: 1.0 }
      //   })
      // console.log(pt)
      const edgeVisibility = (aEdge, bEdge) => {
        const I0 = projectPointOnLine(bEdge.beg, aEdge)
        const I1 = projectPointOnLine(bEdge.end, aEdge)
        const IMid = this.timesPt(this.plusPt(I0, I1), 0.5)
        const PMid = this.timesPt(this.plusPt(aEdge.beg, aEdge.end), 0.5)
        return Math.max(
          0, 1 - 2 * this.distancePt(PMid, IMid) / this.distancePt(I0, I1))
      }
      // console.log(edgeVisibility(aEdge, bEdge), edgeVisibility(bEdge, aEdge))
      const score = Math.min(
        edgeVisibility(aEdge, bEdge), edgeVisibility(bEdge, aEdge))
      // console.log(score)
      return score
    },
    endPtCompatibility (aEdge, bEdge) {
      const isSameBeg = Math.abs(aEdge.beg.x - bEdge.beg.x) < 0.001 && Math.abs(aEdge.beg.y - bEdge.beg.y) < 0.001
      const isSameEnd = Math.abs(aEdge.end.x - bEdge.end.x) < 0.001 && Math.abs(aEdge.end.y - bEdge.end.y) < 0.001
      if (isSameBeg || isSameEnd) {
        return 1
      }
      return 0
    },
    edgeCompatibility (aEdge, bEdge) {
      return this.angleCompatibility(aEdge, bEdge) * this.scaleCompatibility(aEdge, bEdge) * this.positionCompatibility(aEdge, bEdge) * this.visibilityCompatibility(aEdge, bEdge) * this.endPtCompatibility(aEdge, bEdge)
    }
  }
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
  stroke: #a55;
  fill: none;
  stroke-opacity: 0.7;
  stroke-width: 2px;
}

.kanban {
  list-style: none;
  padding: 0;
}

.header {
  display: flex;
}
</style>
