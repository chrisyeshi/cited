<template>
  <v-content>
    <v-navigation-drawer app floating stateless clipped :width="drawerWidth"
      v-model="isDrawerOpen">
      <v-container>
        <div v-show="isDrawerEmpty">Drawer Empty</div>
      </v-container>
    </v-navigation-drawer>
    <div v-if="isGraphViewVisible" class="vis-container">
      <svg class="overlay-container" :style="overlayContainerStyle">
      </svg>
      <div class="cards-container" :style="cardsContainerStyle">
        <!-- TODO: render different styles depend on the article type -->
        <div v-for="(node, index) in visGraph.nodes" :key="index"
          :style="getCardStyle(node)">
          <div :style="getCardSideStyle(node.inGraphReferences.length)"></div>
          <div class="py-1 px-2" :style="cardRowsContainerStyle">
            <div class="text-xs-center font-weight-bold card-row">
              {{ getLabelRowText(node) }}
            </div>
            <div class="text-xs-center text-truncate card-row">
              {{ node.article.data.title }}
            </div>
            <div class="text-xs-center card-row" style="display: flex;">
              <span class="text-truncate" style="display: inline-flex; flex: 1; justify-content: center;">
                <span class="text-truncate" style="white-space: nowrap">
                  {{ node.article.data.venue.name }}
                </span>
              </span>
              <span style="display: inline-flex; justify-content: center;">
                <span class="mx-2">-</span>
              </span>
              <span style="display: inline-flex; flex: 1; justify-content: center;">
                <span style="white-space: nowrap">
                  Cited by {{ node.article.nCitedBys }}
                </span>
              </span>
            </div>
          </div>
          <div :style="getCardSideStyle(node.inGraphCitedBys.length)"></div>
        </div>
      </div>
    </div>
    <v-layout v-if="isEmptyViewVisible" fill-height justify-center align-center>
      <v-dialog max-width="680" scrollable>
        <v-btn flat slot="activator">Add paper to see visualization</v-btn>
        <v-container style="background: white;">
          <pv-article-form></pv-article-form>
        </v-container>
      </v-dialog>
    </v-layout>
  </v-content>
</template>

<script>
import _ from 'lodash'
import PvArticleForm from './PvArticleForm.vue'
import { Graph } from './pvmodels.js'
import { interpolateBuPu as interpolateColor } from 'd3-scale-chromatic'

export default {
  name: 'PvVisView',
  components: { PvArticleForm },
  props: {
    graph: new Graph(),
    isDrawerOpen: false
  },
  data () {
    return {
      drawerWidth: '450',
      drawerState: 'empty',
      cardBorderRadius: 0.65,
      cardHeight: 5.2,
      cardHorizontalSpacing: 4,
      cardOpacity: 0.8,
      cardSideWidth: 0.5,
      cardVerticalSpacing: 0.8,
      cardWidth: 15,
      canvasPadding: { left: 2, top: 2, right: 2, bottom: 2 },
      fontSize: 12
    }
  },
  computed: {
    canvasHeight () {
      const nRows =
        _.max(_.map(this.unsortedIndexGrid, column => column.length))
      return this.canvasPadding.top + nRows * this.cardHeight + (nRows - 1) * this.cardVerticalSpacing + this.canvasPadding.bottom
    },
    canvasWidth () {
      const nColumns = this.maxReferenceLevel + 1
      return this.canvasPadding.left + nColumns * this.cardWidth + (nColumns - 1) * this.cardHorizontalSpacing + this.canvasPadding.right
    },
    cardRowsContainerStyle () {
      return {
        flexGrow: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: '10px',
        background: `rgba(255, 255, 255, ${this.cardOpacity})`
      }
    },
    cardsContainerStyle () {
      return {
        fontSize: this.fontSize + 'px',
        width: this.canvasWidth + 'em',
        height: this.canvasHeight + 'em'
      }
    },
    isDrawerEmpty () { return this.drawerState === 'empty' },
    isEmptyViewVisible () { return this.graph.isEmpty },
    isGraphViewVisible () { return !this.graph.isEmpty },
    maxReferenceLevel () { return _.max(this.referenceLevels) },
    overlayContainerStyle () {
      return {
        fontSize: this.fontSize + 'px',
        width: this.canvasWidth + 'em',
        height: this.canvasHeight + 'em'
      }
    },
    referenceLevels () {
      return getNodeLevels(
        this.graph.nodes, 'inGraphReferences', 'inGraphCitedBys')
    },
    sortedIndexGrid () {
      return _.map(this.unsortedIndexGrid, unsortedIndexColumn => {
        return _.sortBy(unsortedIndexColumn, index => {
          const node = this.graph.nodes[index]
          return -node.inGraphCitedBys.length
        })
      })
    },
    sortedIndexColRows () {
      const colRows = []
      _.forEach(this.sortedIndexGrid, (sortedIndexColumn, iCol) => {
        _.forEach(sortedIndexColumn, (index, iRow) => {
          colRows[index] = { col: iCol, row: iRow }
        })
      })
      return colRows
    },
    unsortedIndexGrid () {
      const maxRefLevel = this.maxReferenceLevel
      const grid = _.map(new Array(maxRefLevel + 1), () => ([]))
      for (let index = 0; index < this.graph.nodes.length; ++index) {
        const columnIndex = this.referenceLevels[index]
        grid[columnIndex].push(index)
      }
      return grid
    },
    visGraph () {
      return new Graph(this.visNodes)
    },
    visNodes () {
      const nodes = new Array(this.graph.nodes.length)
      for (let iNode = 0; iNode < nodes.length; ++iNode) {
        nodes[iNode] =
          new VisNode(
            this.graph.nodes[iNode], this.sortedIndexColRows[iNode], [], [])
      }
      for (let iNode = 0; iNode < nodes.length; ++iNode) {
        nodes[iNode].inGraphReferences =
          _.map(
            nodes[iNode].node.inGraphReferences,
            node => nodes[_.indexOf(this.graph.nodes, node)])
        nodes[iNode].inGraphCitedBys =
          _.map(
            nodes[iNode].node.inGraphCitedBys,
            node => nodes[_.indexOf(this.graph.nodes, node)])
      }
      return nodes
    }
  },
  methods: {
    getCardLeft (iCol) {
      const sumOfSpacings = iCol * this.cardHorizontalSpacing
      const sumOfCardWidths = iCol * this.cardWidth
      return this.canvasPadding.left + sumOfSpacings + sumOfCardWidths
    },
    getCardSideColor (count) {
      const scalar = 1 - Math.exp(Math.log(1) - 0.2 * count)
      return interpolateColor(scalar)
    },
    getCardSideStyle (count) {
      return {
        opacity: this.cardOpacity,
        flex: `0 0 ${this.cardSideWidth}em`,
        backgroundColor: this.getCardSideColor(count)
      }
    },
    getCardStyle (visNode) {
      return {
        position: 'absolute',
        left: `${this.getCardLeft(visNode.col)}em`,
        top: `${this.getCardTop(visNode.row)}em`,
        width: `${this.cardWidth}em`,
        height: `${this.cardHeight}em`,
        background: 'rgba(255, 255, 255, 0.0)',
        borderRadius: this.cardBorderRadius + 'em',
        borderStyle: 'solid',
        borderWidth: '1px',
        display: 'flex',
        overflow: 'hidden'
      }
    },
    getCardTop (iRow) {
      const sumOfSpacings = iRow * this.cardVerticalSpacing
      const sumOfCardHeights = iRow * this.cardHeight
      return this.canvasPadding.top + sumOfSpacings + sumOfCardHeights
    },
    getLabelRowText (node) {
      return `${node.article.data.authors[0].surname} ${node.article.data.year}`
    },
    trace (value) {
      console.log(value)
      return value
    }
  }
}

class VisNode {
  constructor (node, colRow, inGraphReferences, inGraphCitedBys) {
    this.node = node
    this.colRow = colRow
    this.inGraphReferences = inGraphReferences
    this.inGraphCitedBys = inGraphCitedBys
  }
  get article () { return this.node.article }
  get col () { return this.colRow.col }
  get row () { return this.colRow.row }
}

function getNodeLevels (nodes, rootProp, connProp) {
  let levels = _.times(nodes.length, _.constant(0))
  const rootIndexes = nodes.reduce((paperIndexes, node, paperIndex) => {
    if (node[rootProp].length === 0) {
      paperIndexes.push(paperIndex)
    }
    return paperIndexes
  }, [])
  rootIndexes.forEach(paperIndex => { levels[paperIndex] = 0 })
  let bfsQueue = [].concat(rootIndexes)
  while (bfsQueue.length > 0) {
    const currIndex = bfsQueue.shift()
    const connNodes = nodes[currIndex][connProp]
    const paperIndexes = _.map(connNodes, node => _.findIndex(nodes, node))

    paperIndexes.forEach(paperIndex => {
      levels[paperIndex] = levels[paperIndex] ? Math.max(levels[currIndex] + 1, levels[paperIndex]) : levels[currIndex] + 1
      bfsQueue.push(paperIndex)
    })
  }
  return levels
}
</script>

<style scoped>
.vis-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.cards-container {
  position: absolute;
  left: 0px;
  top: 0px;
  overflow: hidden;
}

.card-row {
  min-height: 0px;
}

.overlay-container {
  position: absolute;
  left: 0px;
  top: 0px;
  overflow: hidden;
}
</style>
