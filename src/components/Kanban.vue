<template>
  <div>
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
  </div>
</template>

<script>
import PaperCard from './PaperCard.vue'
import { create as createRect } from './rect.js'
import * as layout from './gridbasedlayout.js'

export default {
  name: 'Kanban',
  components: {
    PaperCard
  },
  data () {
    this.$http.get('/static/insitupdf.json').then(function (res) {
      this.data = res.body
      this.paper = this.data.paper
      this.graph = this.createGraph(this.data.references, this.data.relations)
      this.nodes = this.layoutByMethod(this.graph, this.layoutMethod)
    })
    this.colWidth = 300
    this.nodeSpacing = 20
    return {
      graph: {
        nodes: []
      },
      data: {
        references: [],
        relations: []
      },
      paper: {},
      nodes: [],
      visibleRelations: [],
      visiblePaperRefLinks: [],
      visiblePaperCiteLinks: [],
      layoutMethod: 'layout-by-optimized',
      showLinkMethod: 'show-link-hover'
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
      const colRows = this.getColRows(this.nodes)
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
          const relations = this.extractRelations(this.graph.nodes)
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
    extractRelations: function (graphNodes) {
      const layeredRelations = graphNodes.map((node, paperId) => {
        const citingIds = node.citing
        return citingIds.map(citingId => ({ citing: citingId, citedBy: paperId }))
      })
      return layeredRelations.reduce((acc, val) => acc.concat(val), [])
    },
    getColRows: function (nodes) {
      return nodes.map(node => node.colRow)
    },
    createGraph: function (papers, relations) {
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
      return { nodes: nodes }
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
      if (this.showLinkMethod === 'show-link-click') {
        const set = new Set(this.visiblePaperRefLinks)
        if (set.has(paperIndex)) {
          set.delete(paperIndex)
        } else {
          set.add(paperIndex)
        }
        this.visiblePaperRefLinks = Array.from(set)
      }
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
      const newColRows = this.moveColRow(oldColRows, node.key, newColRow)
      this.nodes = this.getNodesByColRows(this.graph, newColRows)
    },
    moveColRow: function (oldColRows, paperId, newColRow) {
      let grid = layout.toPaperGrid(oldColRows)
      const oldColRow = oldColRows[paperId]
      grid[oldColRow.col][oldColRow.row] = undefined
      grid[newColRow.col].splice(newColRow.row, 0, paperId)
      const tempGrid = grid.map(column => {
        const newCol = column.filter(pid => pid !== undefined)
        return newCol
      })
      const newGrid = tempGrid.filter(col => col.length !== 0)
      return layout.toPaperColRows(newGrid)
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
      const years = graph.nodes.map(node => node.paper.year)
      let onlyUnique = (value, index, self) => self.indexOf(value) === index
      let yearUniqueNum = years.filter(onlyUnique).sort((a, b) => a - b)
      let yearUniqueStr = yearUniqueNum.map(year => year.toString())
      let yearPapers = {}
      yearUniqueStr.forEach(yearStr => {
        yearPapers[yearStr] = []
      })
      graph.nodes.forEach(node => {
        const paper = node.paper
        yearPapers[paper.year.toString()].push(paper)
      })
      yearUniqueStr.forEach(yearStr => {
        yearPapers[yearStr].sort((a, b) => b.citationCount - a.citationCount)
      })
      const colRows = graph.nodes.map(node => {
        const paper = node.paper
        return {
          col: yearUniqueStr.indexOf(paper.year.toString()),
          row: yearPapers[paper.year.toString()].indexOf(paper)
        }
      })
      return this.getNodesByColRows(graph, colRows)
    },
    layoutByRefLevel: function (graph) {
      const citedByLevels = layout.getPaperCitedByLevels(graph)
      const colRows = this.paperColRowsFromRefLevels(citedByLevels)
      return this.getNodesByColRows(graph, colRows)
    },
    layoutByOptimized: function (graph) {
      const citedByLevels = layout.getPaperCitedByLevels(graph)
      const citingLevels = layout.getPaperCitingLevels(graph)
      const colRows = this.paperColRowsFromRefCiteLevels(citedByLevels, citingLevels, graph)
      return this.getNodesByColRows(graph, colRows)
    },
    paperColRowsFromRefCiteLevels: function (refLevels, citeLevels, graph) {
      const paperIds = Object.keys(refLevels)
      const maxRefLevel = Math.max(...paperIds.map(index => refLevels[index]))
      const columnCount = maxRefLevel + 1
      const paperColIntervals = paperIds.map(paperId => {
        const refLevel = refLevels[paperId]
        const citeLevel = citeLevels[paperId]
        return {
          min: citeLevel,
          max: columnCount - 1 - refLevel
        }
      })

      const years = graph.nodes.map(node => node.paper.year)
      const sortedYears = years.slice()
      sortedYears.sort()
      let optimalYearIntervals = []
      for (let iCol = 0; iCol < columnCount; ++iCol) {
        const loId = Math.round(iCol / columnCount * (years.length - 1))
        const upId = Math.round((iCol + 1) / columnCount * (years.length - 1))
        optimalYearIntervals[iCol] = { min: sortedYears[loId], max: sortedYears[upId] }
      }
      // for (let iCol = 1; iCol < columnCount; ++iCol) {
      //   const min = Math.max(optimalYearIntervals[iCol].min, optimalYearIntervals[iCol - 1].max + 1)
      //   const max = Math.max(min, optimalYearIntervals[iCol].max)
      //   optimalYearIntervals[iCol] = { min: min, max: max }
      // }
      // for (let iCol = columnCount - 2; iCol >= 0; --iCol) {
      //   const max = Math.min(optimalYearIntervals[iCol].max, optimalYearIntervals[iCol + 1].min - 1)
      //   const min = Math.min(max, optimalYearIntervals[iCol].min)
      //   optimalYearIntervals[iCol] = { min: min, max: max }
      // }
      let sortedPaperIds = paperIds.slice()
      let colIntervals = paperColIntervals.slice()
      let grid = optimalYearIntervals.map(() => ([]))
      while (sortedPaperIds.length > 0) {
        // console.table(grid)
        sortedPaperIds.sort((a, b) => {
          const aRange = colIntervals[a].max - colIntervals[a].min
          const bRange = colIntervals[b].max - colIntervals[b].min
          return aRange - bRange
        })
        for (let i = 0; i < sortedPaperIds.length; ++i) {
          const paperId = sortedPaperIds[i]
          const colInterval = colIntervals[paperId]
          if (colInterval.min === colInterval.max) {
            grid[colInterval.min].push(paperId)
            continue
          }
          let yearErrors = []
          for (let iCol = colInterval.min; iCol <= colInterval.max; ++iCol) {
            const year = years[paperId]
            const yearInterval = optimalYearIntervals[iCol]
            yearErrors[iCol] = Math.max(0, yearInterval.min - year, year - yearInterval.max)
          }
          const iCols = this.getMinIndexes(yearErrors)
          if (iCols.length === 1) {
            const iCol = iCols[0]
            grid[iCol].push(paperId)
            colIntervals = this.updateColIntervals(paperId, iCol, graph, colIntervals)
            sortedPaperIds = sortedPaperIds.slice(i + 1)
            break
          }
          iCols.sort((a, b) => {
            return grid[a].length - grid[b].length
          })
          const iCol = iCols[0]
          grid[iCol].push(paperId)
          colIntervals = this.updateColIntervals(paperId, iCol, graph, colIntervals)
          sortedPaperIds = sortedPaperIds.slice(i + 1)
          break
        }
      }

      return layout.toPaperColRows(grid)
    },
    updateColIntervals: function (paperId, iCol, graph, colIntervals) {
      let colInts = colIntervals.slice()
      colInts[paperId] = { min: iCol, max: iCol }
      graph.nodes[paperId].citing.forEach(citingId => {
        let interval = colIntervals[citingId]
        colInts[citingId] = {
          min: interval.min,
          max: Math.min(iCol - 1, interval.max)
        }
      })
      graph.nodes[paperId].citedBy.forEach(citedById => {
        let interval = colIntervals[citedById]
        colInts[citedById] = {
          min: Math.max(iCol + 1, interval.min),
          max: interval.max
        }
      })
      return colInts
    },
    getMinIndexes: function (numbers) {
      let min = Number.MAX_SAFE_INTEGER
      let indexes = []
      numbers.forEach((num, iNum) => {
        if (num === undefined) {
          return
        }
        if (num < min) {
          indexes = [ iNum ]
          min = num
        } else if (num === min) {
          indexes.push(iNum)
        }
      })
      return indexes
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
    paperColRowsFromRefLevels: function (refLevels) {
      let colRows = {}
      let columnCounters = []
      const maxRefLevel = Math.max(...Object.keys(refLevels).map(index => refLevels[index]))
      Object.keys(refLevels).forEach(paperId => {
        const colId = maxRefLevel - refLevels[paperId]
        const rowId = columnCounters[colId] ? columnCounters[colId] : 0
        colRows[paperId] = {
          col: colId,
          row: rowId
        }
        columnCounters[colId] = rowId + 1
      })
      return colRows
    },
    findColWithMinRows: function (columnCounters, colInterval) {
      let minColId = Number.MAX_SAFE_INTEGER
      let minRowCount = Number.MAX_SAFE_INTEGER
      for (let colId = colInterval.min; colId <= colInterval.max; ++colId) {
        const rowCount = columnCounters[colId] ? columnCounters[colId] : 0
        if (rowCount < minRowCount) {
          minColId = colId
          minRowCount = columnCounters[colId]
        }
      }
      return minColId
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
    }
  },
  mounted () {
    let vm = this
    // TODO: nextTick being useless? come on vue...
    setTimeout(() => {
      vm.$refs.paperCards.forEach(card => {
        this.graph.nodes[card.paper.key].geo = {
          height: card.$el.clientHeight,
          headerHeight: card.$refs.header.clientHeight
        }
      })
      this.nodes = this.layoutByMethod(this.graph, this.layoutMethod)
    })
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
</style>
