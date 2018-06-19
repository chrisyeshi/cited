<template>
  <div>
    <h4>References of</h4>
    <div>{{ paper.title }}</div>
    <span>{{ paper.authors }}</span>
    <div class="graph-container" ref="graphContainer" v-on:wheel="scrollHorizontally">
      <div class="nodes-container">
        <paper-card v-for="node in nodes" v-bind:paper="node" v-bind:key="node.key" v-on:linkreferences="linkInNetworkReferences" v-on:linkcitations="linkInNetworkCitations"></paper-card>
      </div>
      <svg class="overlay">
        <!-- <line v-for="link in links" :key="link.key" :x1="link.citedBy.x" :y1="link.citedBy.y" :x2="link.citing.x" :y2="link.citing.y"></line> -->
        <path v-for="curve in curves" :key="curve.key" :d="curve.path"></path>
      </svg>
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
      // this.nodes = this.layoutByYears(this.data)
      this.nodes = this.layoutByRefLevel(this.data)
    })
    return {
      data: {
        relations: []
      },
      paper: {},
      nodes: [],
      visibleRelations: []
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
    }
  },
  methods: {
    scrollHorizontally: function (evt) {
      evt.preventDefault()
      let delta = evt.deltaX === 0 ? -evt.deltaY : -Math.sign(evt.deltaX) * Math.hypot(evt.deltaX, evt.deltaY)
      this.$refs.graphContainer.scrollLeft -= delta * 5
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
    // getInNetworkReferences: function (paperIndex) {
    //   const getCitingPaperIndex = relation => relation.citing
    //   const getPaper = paperIndex => this.nodes[paperIndex]
    //   const relations = this.getRelations('citedBy', paperIndex)
    //   return relations.map(getCitingPaperId).map(getPaper)
    // },
    getInNetworkReferenceCount: function (paperIndex) {
      return this.getInNetworkRelations('citedBy', paperIndex).length
    },
    getInNetworkCitationCount: function (paperIndex) {
      return this.getInNetworkRelations('citing', paperIndex).length
    },
    linkInNetworkReferences: function (paperIndex) {
      this.showLinks(this.getInNetworkRelations('citedBy', paperIndex))
    },
    linkInNetworkCitations: function (paperIndex) {
      this.showLinks(this.getInNetworkRelations('citing', paperIndex))
    },
    showLinks: function (relations) {
      this.visibleRelations = relations
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
      let getNodeRect = (paper) => {
        return this.getRectFromColRow({
          col: yearUniqueStr.indexOf(paper.year.toString()),
          row: yearPapers[paper.year.toString()].indexOf(paper)
        })
      }
      return data.references.map((paper, index) => {
        return this.makeNode({
          paper: paper,
          key: index,
          inNetworkReferenceCount: this.getReferenceCount(data.relations, index),
          inNetworkCitationCount: this.getCitationCount(data.relations, index),
          rect: getNodeRect(paper)
        })
      })
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
    makeNode: function ({ paper, key, inNetworkReferenceCount, inNetworkCitationCount, rect }) {
      const headerHeight = 20
      return {
        key: key,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        citationCount: paper.citationCount,
        inNetworkReferenceCount: inNetworkReferenceCount,
        inNetworkCitationCount: inNetworkCitationCount,
        rect: rect,
        headerHeight: headerHeight,
        get style () {
          return {
            left: rect.left + 'px',
            top: rect.top + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px'
          }
        }
      }
    },
    layoutByRefLevel: function ({ paper, references, relations }) {
      const refLevels = this.assignRefLevels(references, relations)
      const colRows = this.paperColRowsFromRefLevels(refLevels)
      const paperRects = this.getRectsFromColRows(colRows)
      return references.map((paper, paperId) => this.makeNode({
        paper: paper,
        key: paperId,
        inNetworkReferenceCount: this.getReferenceCount(relations, paperId),
        inNetworkCitationCount: this.getCitationCount(relations, paperId),
        rect: paperRects[paperId]
      }))
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
    getRectFromColRow: function ({ col, row }) {
      let colWidth = 300
      let nodeSpacing = 20
      let nodeHeight = 105
      return this.makeRect({
        left: (colWidth + nodeSpacing) * col,
        top: (nodeHeight + nodeSpacing) * row,
        width: colWidth,
        height: nodeHeight
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
.graph-container {
  position: relative;
  height: 1900px;
  white-space: nowrap;
  overflow-x: scroll;
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
</style>
