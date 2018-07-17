<template>
  <div>
    <div class="header">
      <div class="paper-title">
        <h4>References of</h4>
        <div>{{ paper.title }}</div>
        <div>{{ paper.authors }}</div>
      </div>
      <div class="header-controls">
        <v-radio-group v-model="computedLayoutMethod" row>
          <v-radio label="by year" value="layout-by-year"></v-radio>
          <v-radio label="by reference level" value="layout-by-reference-level"></v-radio>
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
          {{ yearRange.min }} to {{ yearRange.max }}
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
      this.nodes = this.layoutByMethod(this.data, this.layoutMethod)
    })
    this.colWidth = 300
    this.nodeSpacing = 20
    this.nodeHeight = 105
    return {
      data: {
        references: [],
        relations: []
      },
      paper: {},
      nodes: [],
      visibleRelations: [],
      visiblePaperRefLinks: [],
      visiblePaperCiteLinks: [],
      layoutMethod: 'layout-by-reference-level',
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
      return ret
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
        this.nodes = this.layoutByMethod(this.data, method)
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
    layoutByMethod: function (data, method) {
      if (this.layoutMethod === 'layout-by-year') {
        return this.layoutByYears(data)
      } else if (this.layoutMethod === 'layout-by-reference-level') {
        return this.layoutByRefLevel(data)
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
    layoutByRefLevel: function ({ paper, references, relations }) {
      const refLevels = this.assignRefLevels(references, relations)
      const colRows = this.paperColRowsFromRefLevels(refLevels)
      return this.getNodesByColRows(references, colRows, relations)
    },
    assignRefLevels: function (references, relations) {
      let refLevels = {}
      const rootIds = this.getRootIds(references, relations)
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
    getRootIds: function (references, relations) {
      const paperIds = references.map((paper, index) => index)
      const rootIds = paperIds.filter(paperId => this.getCitationCount(relations, paperId) === 0)
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
