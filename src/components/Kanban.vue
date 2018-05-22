<template>
  <div>
    <h4>References of</h4>
    <div>{{ paper.title }}</div>
    <span>{{ paper.authors }}</span>
    <div class="graph-container" ref="graphContainer" v-on:wheel="scrollHorizontally">
      <div class="nodes-container">
        <paper-card v-for="node in nodes" v-bind:paper="node" v-bind:key="node.key"></paper-card>
      </div>
      <svg class="overlay">
        <line v-for="link in links" :key="link.key" :x1="link.citedBy.x" :y1="link.citedBy.y" :x2="link.citing.x" :y2="link.citing.y"></line>
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
      let data = res.body
      this.data = data
      let years = data.references.map(paper => paper.year)
      let onlyUnique = (value, index, self) => self.indexOf(value) === index
      let yearUniqueNum = years.filter(onlyUnique).sort((a, b) => a - b)
      let yearUniqueStr = yearUniqueNum.map(year => year.toString())
      this.columns = yearUniqueStr
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
      this.colItems = yearPapers
      this.paper = data.paper

      let colWidth = 300
      let nodeSpacing = 20
      let nodeHeight = 100
      let getNodeRect = (paper) => {
        return {
          left: (colWidth + nodeSpacing) * yearUniqueStr.indexOf(paper.year.toString()),
          top: (nodeHeight + nodeSpacing) * yearPapers[paper.year.toString()].indexOf(paper),
          width: colWidth,
          height: nodeHeight,
          get center () {
            return {
              x: this.left + this.width / 2,
              y: this.top + this.height / 2
            }
          }
        }
      }
      this.nodes = data.references.map((paper, index) => {
        let nodeRect = getNodeRect(paper)
        return {
          key: index,
          title: paper.title,
          authors: paper.authors,
          year: paper.year,
          citationCount: paper.citationCount,
          rect: nodeRect,
          get style () {
            return {
              left: nodeRect.left + 'px',
              top: nodeRect.top + 'px',
              width: nodeRect.width + 'px',
              height: nodeRect.height + 'px'
            }
          }
        }
      })
    })
    return {
      data: {
        relations: []
      },
      paper: {},
      nodes: []
    }
  },
  computed: {
    links: function () {
      return this.data.relations.map((relation, index) => {
        let citedBy = this.nodes[relation.citedBy]
        let citing = this.nodes[relation.citing]
        let citedByCtr = citedBy.rect.center
        let citingCtr = citing.rect.center
        return {
          key: index,
          citedBy: {
            x: citedByCtr.x,
            y: citedByCtr.y
          },
          citing: {
            x: citingCtr.x,
            y: citingCtr.y
          }
        }
      })
    }
  },
  methods: {
    scrollHorizontally: function (evt) {
      evt.preventDefault()
      let delta = evt.deltaX === 0 ? -evt.deltaY : -Math.sign(evt.deltaX) * Math.hypot(evt.deltaX, evt.deltaY)
      this.$refs.graphContainer.scrollLeft -= delta * 5
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
