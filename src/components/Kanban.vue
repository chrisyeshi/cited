<template>
  <v-app>
    <v-navigation-drawer absolute stateless hide-overlay v-model="isDrawerVisible" v-bind:width=600 style="overflow: visible;">
      <v-btn class="drawer-collapse-button" absolute v-on:click="isDrawerVisible = !isDrawerVisible">
        <v-icon>{{ isDrawerVisible ? 'arrow_left' : 'arrow_right' }}</v-icon>
      </v-btn>
      <v-toolbar flat>
        <v-text-field hide-details single-line clearable
          placeholder="search paper name"
          v-on:change="search(searchText)"
          v-model="searchText">
        </v-text-field>
        <v-btn icon v-on:click="search(searchText)">
          <v-icon>search</v-icon>
        </v-btn>
      </v-toolbar>
      <v-list>
        <v-list-tile
          v-for="paper in searchResults" v-bind:key="paper.doi">
          <v-list-tile-content>
            {{ paper.title }}
          </v-list-tile-content>
          <v-list-tile-action>
            <v-icon v-bind:color="paper.references.length > 0 ? 'teal' : 'grey'" v-on:click="selectSearchResult(paper)">view_week</v-icon>
          </v-list-tile-action>
          <v-list-tile-action>
            <v-icon v-bind:color="paper.references.length > 0 ? 'teal' : 'grey'" v-on:click="addSearchResult(paper)">plus_one</v-icon>
          </v-list-tile-action>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <div class="header">
      <v-card class="elevation-0">
        <v-card-title primary-title>
          <div>
            <h5>References of</h5>
            <h3 class="headline">{{ paper.title }}</h3>
            <div>{{ paper.authors }}</div>
          </div>
        </v-card-title>
      </v-card>
      <div class="header-controls">
        <v-radio-group v-model="computedLayoutMethod" row>
          <v-radio label="by year" value="layout-by-year"></v-radio>
          <v-radio label="by reference level" value="layout-by-reference-level"></v-radio>
          <v-radio label="by optimized" value="layout-by-optimized"></v-radio>
        </v-radio-group>
        <v-radio-group v-model="computedShowLinkMethod" row>
          <v-radio label="hover" value="show-link-hover"></v-radio>
          <v-radio label="click" value="show-link-click"></v-radio>
          <v-radio label="all" value="show-link-all"></v-radio>
        </v-radio-group>
      </div>
    </div>
    <div class="kanban-container" ref="kanbanContainer" v-on:wheel="scrollHorizontally">
      <div class="years-container">
        <span v-for="(yearInterval, index) in yearIntervalLabels" v-bind:key="index"
          v-bind:style="yearIntervalStyle" class="year-range">
          {{ yearInterval }}
        </span>
      </div>
      <div class="graph-container" v-bind:style="{ 'margin-left': nodeSpacing / 2 + 'px', 'margin-right': nodeSpacing / 2 + 'px' }">
        <div class="nodes-container">
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
            v-on:dragend="movePaperCard"></paper-card>
        </div>
        <svg class="overlay">
          <path v-for="curve in curves" :key="curve.key" :d="curve.path"></path>
        </svg>
      </div>
    </div>
  </v-app>
</template>

<script>
import PaperCard from './PaperCard.vue'
import { create as createRect } from './rect.js'
import * as layout from './gridbasedlayout.js'
import * as api from './crossref.js'

export default {
  name: 'Kanban',
  components: {
    PaperCard
  },
  data () {
    this.$http.get('/static/insitupdf.json').then(function (res) {
      this.data = res.body
      this.paper = this.data.paper
      this.graph = createGraph(this.data.references, this.data.relations)
      this.nodes = this.layoutByMethod(this.graph, this.layoutMethod)
      this.nextTickLayoutPaperCards()
    })
    this.colWidth = 300
    this.nodeSpacing = 20
    return {
      graph: {
        nodes: []
      },
      paper: {},
      nodes: [],
      visibleRelations: [],
      visiblePaperRefLinks: [],
      visiblePaperCiteLinks: [],
      layoutMethod: 'layout-by-optimized',
      showLinkMethod: 'show-link-hover',
      isDrawerVisible: true,
      searchText: '',
      searchResults: []
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
            y: citedBy.rect.top + this.graph.nodes[relation.citedBy].geo.headerHeight / 2
          },
          citing: {
            x: citing.rect.right,
            y: citing.rect.top + this.graph.nodes[relation.citedBy].geo.headerHeight / 2
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
          y: citedBy.rect.top + this.graph.nodes[relation.citedBy].geo.headerHeight / 2
        }
        const end = {
          x: citing.rect.right,
          y: citing.rect.top + this.graph.nodes[relation.citedBy].geo.headerHeight / 2
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
          const relations = extractRelations(this.graph.nodes)
          this.showLinks(relations)
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
      api.search(text).then(papers => {
        this.searchResults = papers
      })
    },
    selectSearchResult: function (paper) {
      this.paper = paper
      const dois = this.paper.references.map(ref => ref.doi)
      Promise.all(dois.map(doi => api.getPaperByDOI(doi))).then(papers => {
        this.graph = compileGraph(papers)
        this.nodes = this.layoutByMethod(this.graph, this.layoutMethod)
        this.nextTickLayoutPaperCards()
      })
    },
    addSearchResult: function (paper) {
      this.graph = addToGraph(this.graph, paper)
      this.nodes = this.layoutByMethod(this.graph, this.layoutMethod)
      this.nextTickLayoutPaperCards()
    },
    scrollHorizontally: function (evt) {
      evt.preventDefault()
      let delta = evt.deltaX === 0 ? -evt.deltaY : -Math.sign(evt.deltaX) * Math.hypot(evt.deltaX, evt.deltaY)
      this.$refs.kanbanContainer.scrollLeft -= delta * 5
    },
    getInNetworkRelations: function (prop, paperIndex) {
      if (prop === 'citing') {
        return this.graph.nodes[paperIndex].citedBy.map(relatedId => ({
          citing: paperIndex,
          citedBy: relatedId
        }))
      } else {
        return this.graph.nodes[paperIndex].citing.map(relatedId => ({
          citing: relatedId,
          citedBy: paperIndex
        }))
      }
    },
    handleMouseOverRefCount: function (paperIndex) {
      if (this.showLinkMethod === 'show-link-hover') {
        const set = new Set(this.visiblePaperRefLinks)
        set.add(paperIndex)
        this.visiblePaperRefLinks = Array.from(set)
      }
    },
    handleMouseOutRefCount: function (paperIndex) {
      if (this.showLinkMethod === 'show-link-hover') {
        const set = new Set(this.visiblePaperRefLinks)
        set.delete(paperIndex)
        this.visiblePaperRefLinks = Array.from(set)
      }
    },
    handleClickRefCount: function (paperIndex) {
      // show/hide links
      if (this.showLinkMethod === 'show-link-click') {
        const set = new Set(this.visiblePaperRefLinks)
        if (set.has(paperIndex)) {
          set.delete(paperIndex)
        } else {
          set.add(paperIndex)
        }
        this.visiblePaperRefLinks = Array.from(set)
      }
      // show all references in search panel
      const paper = this.graph.nodes[paperIndex].paper
      const dois = paper.references.map(ref => ref.doi)
      const promises = dois.map(doi => {
        return api.getPaperByDOI(doi).then(response => {
          return response
        }).catch(() => {
          return null
        })
      })
      Promise.all(promises).then(responses => {
        const papers = responses.filter(res => res !== null)
        this.searchResults = papers
      })
    },
    handleMouseOverCiteCount: function (paperIndex) {
      if (this.showLinkMethod === 'show-link-hover') {
        const set = new Set(this.visiblePaperCiteLinks)
        set.add(paperIndex)
        this.visiblePaperCiteLinks = Array.from(set)
      }
    },
    handleMouseOutCiteCount: function (paperIndex) {
      if (this.showLinkMethod === 'show-link-hover') {
        const set = new Set(this.visiblePaperCiteLinks)
        set.delete(paperIndex)
        this.visiblePaperCiteLinks = Array.from(set)
      }
    },
    handleClickCiteCount: function (paperIndex) {
      if (this.showLinkMethod === 'show-link-click') {
        const set = new Set(this.visiblePaperCiteLinks)
        if (set.has(paperIndex)) {
          set.delete(paperIndex)
        } else {
          set.add(paperIndex)
        }
        this.visiblePaperCiteLinks = Array.from(set)
      }
    },
    linkInNetworkReferences: function (paperIndex) {
      this.showLinks(this.getInNetworkRelations('citedBy', paperIndex))
    },
    unlinkInNetworkReferences: function (paperIndex) {
      this.showLinks([])
    },
    linkInNetworkCitations: function (paperIndex) {
      this.showLinks(this.getInNetworkRelations('citing', paperIndex))
    },
    unlinkInNetworkCitations: function (paperIndex) {
      this.showLinks([])
    },
    showLinks: function (relations) {
      this.visibleRelations = relations
    },
    getVisibleLinks: function (paperRefLinks, paperCiteLinks) {
      let strSet = new Set()
      paperRefLinks.forEach(paperId => {
        this.getInNetworkRelations('citedBy', paperId).map(relation => JSON.stringify(relation)).forEach(str => strSet.add(str))
      })
      paperCiteLinks.forEach(paperId => {
        this.getInNetworkRelations('citing', paperId).map(relation => JSON.stringify(relation)).forEach(str => strSet.add(str))
      })
      const ret = Array.from(strSet).map(str => JSON.parse(str))
      return ret
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
          const height = graph.nodes[paperId].geo.height
          const paper = this.graph.nodes[paperId].paper
          nodes[paperId] = {
            key: paperId,
            title: paper.title,
            authors: paper.authors,
            year: paper.year,
            referenceCount: paper.references.length,
            citationCount: paper.citationCount,
            inNetworkReferenceCount: this.graph.nodes[paperId].citing.length,
            inNetworkCitationCount: this.graph.nodes[paperId].citedBy.length,
            colRow: { col: iCol, row: iRow },
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
      const colHeights = column.map(paperId => this.graph.nodes[paperId].geo.height)
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
        this.graph.nodes[card.paper.key].geo = {
          height: card.$el.clientHeight,
          headerHeight: card.$refs.header.clientHeight
        }
      })
    }
  }
}

function extractRelations (graphNodes) {
  const layeredRelations = graphNodes.map((node, paperId) => {
    const citingIds = node.citing
    return citingIds.map(citingId => ({ citing: citingId, citedBy: paperId }))
  })
  return layeredRelations.reduce((acc, val) => acc.concat(val), [])
}

function createGraph (papers, relations) {
  const nodes = papers.map(paper => ({
    paper: paper,
    citing: [],
    citedBy: [],
    geo: { height: 0, headerHeight: 0 }
  }))
  relations.forEach(relation => {
    nodes[relation.citing].citedBy.push(relation.citedBy)
    nodes[relation.citedBy].citing.push(relation.citing)
  })
  nodes.forEach(node => {
    node.paper.references = node.citing
  })
  return { nodes: nodes }
}

function compileGraph (papers) {
  const nodes = papers.map(paper => ({
    paper: paper,
    citing: [],
    citedBy: [],
    geo: { height: 0, headerHeight: 0 }
  }))
  papers.forEach((paper, paperId) => {
    const references = paper.references
    const refDois = references.map(ref => ref.doi)
    const inNetworkReferences = refDois.map(doi => {
      if (doi === undefined) {
        return null
      }
      return nodes.findIndex(node => {
        return doi === node.paper.doi
      })
    })
    nodes[paperId].citing = inNetworkReferences.filter(value => {
      return value !== undefined && value !== null && value !== -1
    })
  })
  nodes.forEach((node, citedBy) => {
    node.citing.forEach(citing => {
      nodes[citing].citedBy.push(citedBy)
    })
  })
  // console.log(nodes)
  return { nodes: nodes }
}

function addToGraph (graph, paper) {
  const node = {
    paper: paper,
    citing: [],
    citedBy: [],
    geo: { height: 0, headerHeight: 0 }
  }
  const paperId = graph.nodes.push(node) - 1
  // citing
  const refDois = paper.references.map(ref => ref.doi)
  const inNetworkReferences = refDois.map(doi => {
    if (doi === undefined) {
      return null
    }
    return graph.nodes.findIndex(node => {
      return doi === node.paper.doi
    })
  })
  node.citing = inNetworkReferences.filter(value => {
    return value !== undefined && value !== null && value !== -1
  })
  node.citing.forEach(citing => {
    graph.nodes[citing].citedBy.push(paperId)
  })
  // citedBy
  graph.nodes.forEach((eachNode, eachNodeId) => {
    const refDois = eachNode.paper.references.map(ref => ref.doi)
    if (refDois.includes(paper.doi)) {
      eachNode.citing.push(paperId)
      node.citedBy.push(eachNodeId)
    }
  })
  return graph
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
}

.graph-container {
  position: relative;
  height: 1560px;
  white-space: nowrap;
}

.overlay {
  position: absolute;
  width: 100%;
  height: 100%;
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
  stroke-width: 20px;
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

.drawer-collapse-button {
  left: 100%;
  top: 10px;
  width: 22px;
  height: 48px;
  min-width: 0px;
  padding: 0px;
}

.drawer-collapse-button .v-icon {
  font-size: 22px;
}
</style>
