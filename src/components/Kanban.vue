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
          <v-list-tile v-on:click="computedLayoutMethod = 'layout-by-optimized'">
            <v-list-tile-title>layout hybrid</v-list-tile-title>
          </v-list-tile>
        </v-list>
      </v-menu>
      <v-btn icon to="/contail"><v-icon>data_usage</v-icon></v-btn>
      <v-btn icon><v-icon>account_circle</v-icon></v-btn>
    </v-toolbar>
    <v-content app>
      <v-container ref="kanbanContainer" fluid kanban-container
        v-on:mousewheel="preventTrackpadSwipeToBack">
        <div class="years-container"
          :style="`margin: 5px -${nodeSpacing / 2}px;`">
          <span
            v-for="(yearInterval, index) in yearIntervalLabels" v-bind:key="index"
            v-bind:style="yearIntervalStyle" class="year-range">
            <h2>{{ yearInterval }}</h2>
          </span>
        </div>
        <div class="graph-container">
          <div class="nodes-container" ref="nodesContainer">
            <paper-card
              ref="paperCards"
              v-for="node in nodes" v-bind:key="node.key"
              v-bind:paper="node"
              v-on:update:paper="updateNode($event)"
              v-on:mouseoverrefcount="handleMouseOverRefCount($event)"
              v-on:mouseoutrefcount="handleMouseOutRefCount($event)"
              v-on:clickrefcount="handleClickRefCount($event)"
              v-on:mouseovercitecount="handleMouseOverCiteCount($event)"
              v-on:mouseoutcitecount="handleMouseOutCiteCount($event)"
              v-on:clickcitecount="handleClickCiteCount($event)"
              v-on:clicktitle="handleClickTitle($event)"
              v-on:clickhandle="handleClickHandle($event)"
              v-on:dragend="movePaperCard"></paper-card>
          </div>
          <svg class="overlay">
            <path v-for="curve in curves" :key="curve.key" :d="curve.path"></path>
          </svg>
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
    this.$http.get('/static/insitupdf.json').then(function (res) {
      this.data = res.body
      this.paper = this.data.paper
      this.title = this.paper.title
      this.graph = Graph.fromTestJson({
        papers: this.data.references,
        relations: this.data.relations
      })
      this.nodes = this.layoutByMethod(this.graph, this.layoutMethod)
      this.nextTickLayoutPaperCards()
    })
    this.colWidth = 300
    this.nodeSpacing = 20
    return {
      graph: {
        nodes: []
      },
      title: 'Papers',
      paper: {},
      nodes: [],
      visibleRelations: [],
      visiblePaperRefLinks: [],
      visiblePaperCiteLinks: [],
      layoutMethod: 'layout-by-optimized',
      showLinkMethod: 'show-link-hover',
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
      return this.visibleRelations.map((relation, index) => {
        let citedBy = this.nodes[relation.citedBy]
        let citing = this.nodes[relation.citing]
        return {
          key: index,
          citedBy: {
            x: citedBy.rect.left,
            y: citedBy.rect.top + this.graph.nodes[relation.citedBy].geometry.headerHeight / 2
          },
          citing: {
            x: citing.rect.right,
            y: citing.rect.top + this.graph.nodes[relation.citedBy].geometry.headerHeight / 2
          }
        }
      })
    },
    curves: function () {
      return this.visibleRelations.map((relation, index) => {
        let citedBy = this.nodes[relation.citedBy]
        let citing = this.nodes[relation.citing]
        const start = {
          x: citedBy.rect.left,
          y: citedBy.rect.top + this.graph.nodes[relation.citedBy].geometry.headerHeight / 2
        }
        const end = {
          x: citing.rect.right,
          y: citing.rect.top + this.graph.nodes[relation.citedBy].geometry.headerHeight / 2
        }
        const interpolate = (beg, end, ratio) => {
          return ratio * (end - beg) + beg
        }
        const ratio = 0.75
        return {
          key: index,
          path: `M${start.x} ${start.y} C ${interpolate(start.x, end.x, ratio)} ${start.y}, ${interpolate(end.x, start.x, ratio)} ${end.y}, ${end.x} ${end.y}`
        }
      })
    },
    yearIntervalLabels: function () {
      const colRows = this.nodes.map(node => node.colRow)
      const grid = layout.toPaperGrid(colRows)
      const yearIntervals = grid.map(column => {
        const colPapers = column.map(paperId => this.graph.nodes[paperId].paper)
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
        'margin-left': this.nodeSpacing / 2 + 'px',
        'margin-right': this.nodeSpacing / 2 + 'px'
      }
    },
    computedLayoutMethod: {
      get: function () {
        return this.layoutMethod
      },
      set: function (method) {
        this.layoutMethod = method
        this.nodes = this.layoutByMethod(this.graph, method)
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
        } else {
          this.visiblePaperRefLinks = []
          this.visiblePaperCiteLinks = []
          this.showLinks([])
        }
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
      const dois = this.paper.references.map(ref => ref.doi)
      Promise.all(dois.map(doi => api.getPaperByDOI(doi))).then(objects => {
        const papers = objects.filter(obj => obj !== null)
        this.graph = Graph.fromPapers(papers)
        this.nodes = this.layoutByMethod(this.graph, this.layoutMethod)
        this.nextTickLayoutPaperCards()
      })
    },
    searchResultInsert: function (paper) {
      // this.graph = addToGraph(this.graph, paper)
      this.graph.insert(paper)
      this.nodes = this.layoutByMethod(this.graph, this.layoutMethod)
      this.nextTickLayoutPaperCards()
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
    handleMouseOverRefCount: function (paperIndex) {
      if (this.showLinkMethod === 'show-link-hover') {
        this.visiblePaperRefLinks =
          _.union(this.visiblePaperRefLinks, [ paperIndex ])
      }
    },
    handleMouseOutRefCount: function (paperIndex) {
      if (this.showLinkMethod === 'show-link-hover') {
        this.visiblePaperRefLinks =
          _.without(this.visiblePaperRefLinks, paperIndex)
      }
    },
    handleClickRefCount: function (paperIndex) {
      if (this.showLinkMethod === 'show-link-click') {
        if (_.includes(this.visiblePaperRefLinks, paperIndex)) {
          this.visiblePaperRefLinks =
            _.without(this.visiblePaperRefLinks, paperIndex)
        } else {
          this.visiblePaperRefLinks =
            _.union(this.visiblePaperRefLinks, [ paperIndex ])
        }
      }
    },
    handleMouseOverCiteCount: function (paperIndex) {
      if (this.showLinkMethod === 'show-link-hover') {
        this.visiblePaperCiteLinks =
          _.union(this.visiblePaperCiteLinks, [ paperIndex ])
      }
    },
    handleMouseOutCiteCount: function (paperIndex) {
      if (this.showLinkMethod === 'show-link-hover') {
        this.visiblePaperCiteLinks =
          _.without(this.visiblePaperCiteLinks, paperIndex)
      }
    },
    handleClickCiteCount: function (paperIndex) {
      if (this.showLinkMethod === 'show-link-click') {
        if (_.includes(this.visiblePaperCiteLinks, paperIndex)) {
          this.visiblePaperCiteLinks =
            _.without(this.visiblePaperCiteLinks, paperIndex)
        } else {
          this.visiblePaperCiteLinks =
            _.union(this.visiblePaperCiteLinks, [ paperIndex ])
        }
      }
    },
    handleClickTitle: function (paperIndex) {
      this.isDrawerVisible = true
      this.showPaperDetail(this.graph.nodes[paperIndex].paper)
    },
    handleClickHandle: function (paperIndex) {
      this.graph.toggleSelectedByIndex(paperIndex)
      const colRows = this.nodes.map(node => node.colRow)
      this.nodes = this.getNodesByColRows(this.graph, colRows)
    },
    preventTrackpadSwipeToBack: function (evt) {
      evt.preventDefault()
      this.$refs.kanbanContainer.scrollLeft = Math.max(1, this.$refs.kanbanContainer.scrollLeft + evt.deltaX)
      this.$refs.kanbanContainer.scrollTop = this.$refs.kanbanContainer.scrollTop + evt.deltaY
    },
    showLinks: function (relations) {
      this.visibleRelations = relations
    },
    getVisibleLinks: function (paperRefLinks, paperCiteLinks) {
      return this.graph.getUnionRelations(paperCiteLinks, paperRefLinks)
    },
    movePaperCard: function (node, evt) {
      const oldColRows = this.nodes.map(node => node.colRow)
      const newColRow = this.getColRowByRect(this.nodes, node.rect)
      const newColRows = layout.moveColRow(oldColRows, node.key, newColRow)
      this.nodes = this.getNodesByColRows(this.graph, newColRows)
    },
    layoutByMethod: function (graph, method) {
      if (this.layoutMethod === 'layout-by-year') {
        return this.layoutByYears(graph)
      } else if (this.layoutMethod === 'layout-by-reference-level') {
        return this.layoutByRefLevel(graph)
      } else if (this.layoutMethod === 'layout-by-optimized') {
        return this.layoutByOptimized(graph)
      }
    },
    layoutByYears: function (graph) {
      const colRows = layout.getColRowsByYears(graph.nodes)
      return this.getNodesByColRows(graph, colRows)
    },
    layoutByRefLevel: function (graph) {
      const colRows = layout.getColRowsByCitedLevels(graph.nodes)
      return this.getNodesByColRows(graph, colRows)
    },
    layoutByOptimized: function (graph) {
      const colRows = layout.getColRowsByOptimalYearIntervals(graph.nodes)
      return this.getNodesByColRows(graph, colRows)
    },
    getNodesByColRows: function (graph, colRows) {
      const grid = layout.toPaperGrid(colRows)
      let nodes = []
      grid.forEach((column, iCol) => {
        let top = 0
        column.forEach((paperIdStr, iRow) => {
          const paperId = parseInt(paperIdStr)
          const graphNode = graph.nodes[paperId]
          const height = graphNode.geometry.height
          const paper = graphNode.paper
          nodes[paperId] = {
            key: paperId,
            title: paper.title,
            authors: paper.authors,
            year: paper.year,
            referenceCount: paper.references.length,
            citationCount: paper.citationCount,
            inNetworkReferenceCount: graphNode.inGraphCitings.length,
            inNetworkCitationCount: graphNode.inGraphCitedBys.length,
            colRow: { col: iCol, row: iRow },
            highlight: graphNode.selected,
            rect: createRect({
              left: iCol * (this.colWidth + this.nodeSpacing),
              top: top,
              width: this.colWidth,
              height: height
            })
          }
          top += height + this.nodeSpacing
        })
      })
      return nodes
    },
    getColRowByRect: function (nodes, rect) {
      const col = Math.floor((rect.center.x + 0.5 * this.nodeSpacing) / (this.colWidth + this.nodeSpacing))
      const colRows = nodes.map(node => node.colRow)
      const grid = layout.toPaperGrid(colRows)
      const column = grid[col]
      const colHeights = column.map(paperId => this.graph.nodes[paperId].geometry.height)
      const colCenterYs = colHeights.reduce((centerYs, height) => {
        if (centerYs.length === 0) {
          centerYs.push(height / 2)
        } else {
          const lastCenterY = centerYs[centerYs.length - 1]
          centerYs.push(lastCenterY + this.nodeSpacing + height)
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
    updateNode: function (node) {
      this.$set(this.nodes, node.key, node)
    },
    nextTickLayoutPaperCards: function () {
      this.$nextTick().then(() => {
        this.updateGeos()
        this.nodes = this.layoutByMethod(this.graph, this.layoutMethod)
      })
    },
    updateGeos: function () {
      this.$refs.paperCards.forEach(card => {
        this.graph.nodes[card.paper.key].geometry = {
          height: card.$el.clientHeight,
          headerHeight: card.$refs.header.computedHeight
        }
      })
    }
  }
}

</script>

<style scoped>
.years-container {
  white-space: nowrap;
}

.year-range {
  text-align: center;
}

.kanban-container {
  position: relative;
  height: 100%;
  white-space: nowrap;
  overflow-x: scroll;
  overflow-y: scroll;
}

.graph-container {
  position: relative;
  white-space: nowrap;
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
  stroke-width: 5px;
}

.kanban {
  list-style: none;
  padding: 0;
}

.nodes-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.header {
  display: flex;
}
</style>
