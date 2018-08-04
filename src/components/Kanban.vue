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
        <span v-for="(yearRange, index) in yearRanges" v-bind:key="index"
          v-bind:style="yearRangeStyle" class="year-range">
          {{ yearRange }}
        </span>
      </div>
      <div class="graph-container" v-bind:style="{ 'margin-left': nodeSpacing / 2 + 'px', 'margin-right': nodeSpacing / 2 + 'px' }">
        <div class="nodes-container">
          <paper-card
            v-for="node in nodes" v-bind:key="node.key"
            v-bind:paper.sync="node"
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
      this.nodes = this.layoutByMethod(this.data, this.graph, this.layoutMethod)
    })
    this.colWidth = 300
    this.nodeSpacing = 20
    this.nodeHeight = 105
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
            y: citedBy.rect.top + citedBy.headerHeight / 2
          },
          citing: {
            x: citing.rect.right,
            y: citing.rect.top + citing.headerHeight / 2
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
          y: citedBy.rect.top + citedBy.headerHeight / 2
        }
        const end = {
          x: citing.rect.right,
          y: citing.rect.top + citing.headerHeight / 2
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
    yearRanges: function () {
      let ret = []
      this.nodes.forEach(node => {
        ret[node.colRow.col] = ret[node.colRow.col] === undefined
          ? { min: Number.MAX_SAFE_INTEGER, max: Number.MIN_SAFE_INTEGER }
          : ret[node.colRow.col]
        ret[node.colRow.col].min = Math.min(node.year, ret[node.colRow.col].min)
        ret[node.colRow.col].max = Math.max(node.year, ret[node.colRow.col].max)
      })
      return ret.map(range => {
        if (range.min === range.max) {
          return `${range.min}`
        }
        return `${range.min} to ${range.max}`
      })
    },
    yearRangeStyle: function () {
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
        this.nodes = this.layoutByMethod(this.data, this.graph, method)
      }
    },
    computedShowLinkMethod: {
      get: function () {
        return this.showLinkMethod
      },
      set: function (method) {
        this.showLinkMethod = method
        if (method === 'show-link-all') {
          this.showLinks(this.data.relations)
        } else {
          this.visiblePaperRefLinks = []
          this.visiblePaperCiteLinks = []
          this.showLinks([])
        }
      }
    }
  },
  methods: {
    createGraph: function (papers, relations) {
      const nodes = papers.map(paper => ({ paper: paper, citing: [], citedBy: [] }))
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
    getRelations: function (relations, prop, paperIndex) {
      const IsPaperInRelation = relation => relation[prop] === paperIndex
      return relations.filter(IsPaperInRelation)
    },
    getReferenceIds: function (relations, paperIndex) {
      return this.getRelations(relations, 'citedBy', paperIndex).map(relation => relation.citing)
    },
    getCitationIds: function (relations, paperIndex) {
      return this.getRelations(relations, 'citing', paperIndex).map(relation => relation.citedBy)
    },
    getReferenceCount: function (relations, paperIndex) {
      return this.getRelations(relations, 'citedBy', paperIndex).length
    },
    getCitationCount: function (relations, paperIndex) {
      return this.getRelations(relations, 'citing', paperIndex).length
    },
    getInNetworkRelations: function (prop, paperIndex) {
      return this.getRelations(this.data.relations, prop, paperIndex)
    },
    getInNetworkReferenceCount: function (paperIndex) {
      return this.getInNetworkRelations('citedBy', paperIndex).length
    },
    getInNetworkCitationCount: function (paperIndex) {
      return this.getInNetworkRelations('citing', paperIndex).length
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
      const colRow = this.getColRowByRect(node.rect)
      const oldColRows = this.nodes.map(node => node.colRow)
      const newColRows = this.moveColRow(oldColRows, node.key, colRow)
      this.nodes = this.getNodesByColRows(this.data.references, newColRows, this.data.relations)
    },
    moveColRow: function (oldColRows, paperId, newColRow) {
      const grid = []
      Object.keys(oldColRows).forEach(pid => {
        const colRow = oldColRows[pid]
        grid[colRow.col] = grid[colRow.col] === undefined ? [] : grid[colRow.col]
        grid[colRow.col][colRow.row] = pid
      })
      const oldColRow = oldColRows[paperId]
      grid[oldColRow.col][oldColRow.row] = undefined
      grid[newColRow.col].splice(newColRow.row, 0, paperId)
      const tempGrid = grid.map(column => {
        const newCol = column.filter(pid => pid !== undefined)
        return newCol
      })
      const newGrid = tempGrid.filter(col => col.length !== 0)
      const newColRows = {}
      newGrid.forEach((column, col) => {
        column.forEach((pid, row) => {
          newColRows[pid] = {
            col: col,
            row: row
          }
        })
      })
      return newColRows
    },
    layoutByMethod: function (data, graph, method) {
      if (this.layoutMethod === 'layout-by-year') {
        return this.layoutByYears(data)
      } else if (this.layoutMethod === 'layout-by-reference-level') {
        return this.layoutByRefLevel(data)
      } else if (this.layoutMethod === 'layout-by-optimized') {
        return this.layoutByOptimized(data, graph)
      }
    },
    layoutByYears: function (data) {
      let years = data.references.map(paper => paper.year)
      let onlyUnique = (value, index, self) => self.indexOf(value) === index
      let yearUniqueNum = years.filter(onlyUnique).sort((a, b) => a - b)
      let yearUniqueStr = yearUniqueNum.map(year => year.toString())
      let yearPapers = {}
      yearUniqueStr.forEach(yearStr => {
        yearPapers[yearStr] = []
      })
      data.references.forEach(paper => {
        yearPapers[paper.year.toString()].push(paper)
      })
      yearUniqueStr.forEach(yearStr => {
        yearPapers[yearStr].sort((a, b) => b.citationCount - a.citationCount)
      })
      const colRows = data.references.map(paper => ({
        col: yearUniqueStr.indexOf(paper.year.toString()),
        row: yearPapers[paper.year.toString()].indexOf(paper)
      }))
      return this.getNodesByColRows(data.references, colRows, data.relations)
    },
    layoutByRefLevel: function ({ paper, references, relations }) {
      const refLevels = this.assignRefLevels(references, relations)
      const colRows = this.paperColRowsFromRefLevels(refLevels)
      return this.getNodesByColRows(references, colRows, relations)
    },
    layoutByOptimized: function ({ paper, references, relations }, graph) {
      const refLevels = this.assignRefLevels(references, relations)
      const citeLevels = this.assignCiteLevels(references, relations)
      const colRows = this.paperColRowsFromRefCiteLevels(refLevels, citeLevels, graph)
      return this.getNodesByColRows(references, colRows, relations)
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
      let optimalYearRanges = []
      for (let iCol = 0; iCol < columnCount; ++iCol) {
        const loId = Math.round(iCol / columnCount * (years.length - 1))
        const upId = Math.round((iCol + 1) / columnCount * (years.length - 1))
        optimalYearRanges[iCol] = { min: sortedYears[loId], max: sortedYears[upId] }
      }
      // for (let iCol = 1; iCol < columnCount; ++iCol) {
      //   const min = Math.max(optimalYearRanges[iCol].min, optimalYearRanges[iCol - 1].max + 1)
      //   const max = Math.max(min, optimalYearRanges[iCol].max)
      //   optimalYearRanges[iCol] = { min: min, max: max }
      // }
      // for (let iCol = columnCount - 2; iCol >= 0; --iCol) {
      //   const max = Math.min(optimalYearRanges[iCol].max, optimalYearRanges[iCol + 1].min - 1)
      //   const min = Math.min(max, optimalYearRanges[iCol].min)
      //   optimalYearRanges[iCol] = { min: min, max: max }
      // }
      let sortedPaperIds = paperIds.slice()
      let colIntervals = paperColIntervals.slice()
      let grid = optimalYearRanges.map(() => ([]))
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
            const yearInterval = optimalYearRanges[iCol]
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

      return this.gridToColRows(grid)
    },
    gridToColRows: function (grid) {
      let colRows = {}
      for (let iCol = 0; iCol < grid.length; ++iCol) {
        const column = grid[iCol]
        for (let iRow = 0; iRow < column.length; ++iRow) {
          const paperId = column[iRow]
          colRows[paperId] = { col: iCol, row: iRow }
        }
      }
      return colRows
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
    makeRect: function ({ left, top, width, height }) {
      return {
        left: left,
        top: top,
        width: width,
        height: height,
        get right () {
          return this.left + this.width
        },
        get center () {
          return {
            x: this.left + this.width / 2,
            y: this.top + this.height / 2
          }
        }
      }
    },
    makeNode: function ({ paper, key, inNetworkReferenceCount, inNetworkCitationCount, colRow }) {
      const headerHeight = 20
      return {
        key: key,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        citationCount: paper.citationCount,
        inNetworkReferenceCount: inNetworkReferenceCount,
        inNetworkCitationCount: inNetworkCitationCount,
        colRow: colRow,
        rect: this.getRectFromColRow(colRow),
        headerHeight: headerHeight
      }
    },
    getNodesByColRows: function (papers, colRows, relations) {
      return papers.map((paper, paperId) => this.makeNode({
        paper: paper,
        key: paperId,
        inNetworkReferenceCount: this.getReferenceCount(relations, paperId),
        inNetworkCitationCount: this.getCitationCount(relations, paperId),
        colRow: colRows[paperId]
      }))
    },
    assignCiteLevels: function (references, relations) {
      let citeLevels = {}
      const rootIds = this.getCiteRootIds(references, relations)
      rootIds.forEach(paperId => { citeLevels[paperId] = 0 })
      let bfsQueue = [].concat(rootIds)
      while (bfsQueue.length > 0) {
        const currId = bfsQueue.shift()
        const citeIds = this.getCitationIds(relations, currId)
        citeIds.forEach(paperId => {
          citeLevels[paperId] = citeLevels[paperId] ? Math.max(citeLevels[currId] + 1, citeLevels[paperId]) : citeLevels[currId] + 1
          bfsQueue.push(paperId)
        })
      }
      return citeLevels
    },
    assignRefLevels: function (references, relations) {
      let refLevels = {}
      const rootIds = this.getRefRootIds(references, relations)
      rootIds.forEach(paperId => { refLevels[paperId] = 0 })
      let bfsQueue = [].concat(rootIds)
      while (bfsQueue.length > 0) {
        const currId = bfsQueue.shift()
        const refIds = this.getReferenceIds(relations, currId)
        refIds.forEach(paperId => {
          refLevels[paperId] = refLevels[paperId] ? Math.max(refLevels[currId] + 1, refLevels[paperId]) : refLevels[currId] + 1
          bfsQueue.push(paperId)
        })
      }
      return refLevels
    },
    getRefRootIds: function (references, relations) {
      const paperIds = references.map((paper, index) => index)
      const rootIds = paperIds.filter(paperId => this.getCitationCount(relations, paperId) === 0)
      return rootIds
    },
    getCiteRootIds: function (references, relations) {
      const paperIds = references.map((paper, index) => index)
      const rootIds = paperIds.filter(paperId => this.getReferenceCount(relations, paperId) === 0)
      return rootIds
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
    getColRowByRect: function (rect) {
      const col = Math.floor((rect.center.x + 0.5 * this.nodeSpacing) / (this.colWidth + this.nodeSpacing))
      const row = Math.floor((rect.center.y + 0.5 * this.nodeSpacing) / (this.nodeHeight + this.nodeSpacing))
      return {
        col: col,
        row: row
      }
    },
    getRectFromColRow: function ({ col, row }) {
      return this.makeRect({
        left: (this.colWidth + this.nodeSpacing) * col,
        top: (this.nodeHeight + this.nodeSpacing) * row,
        width: this.colWidth,
        height: this.nodeHeight
      })
    },
    getRectsFromColRows: function (colRows) {
      let rects = {}
      Object.keys(colRows).forEach(paperId => {
        rects[paperId] = this.getRectFromColRow(colRows[paperId])
      })
      return rects
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
