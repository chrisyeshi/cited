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
            <path v-for="curve in curves" :key="curve.key" :d="curve.path"></path>
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
      drawerComponent: 'search-results'
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
    },
    handleRemoveCard: function (paperIndex) {
      this.graph.remove(paperIndex)
      this.cards = this.layoutByMethod(this.graph, this.layoutMethod)
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
    },
    getVisibleLinks: function (paperRefLinks, paperCiteLinks) {
      return this.graph.getUnionRelations(paperCiteLinks, paperRefLinks)
    },
    movePaperCard: function (node, evt) {
      const oldColRows = this.cards.map(card => card.colRow)
      const newColRow = this.getColRowByRect(this.cards, node.rect)
      const newColRows = layout.moveColRow(oldColRows, node.index, newColRow)
      this.cards = this.getCardsByColRows(this.graph, newColRows)
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
    console: function (value) {
      console.log(value)
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
