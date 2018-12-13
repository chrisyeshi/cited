<template>
  <v-layout column>
    <v-toolbar dense flat class="pb-0" color="transparent">
      <v-layout fill-height align-end>
        <v-layout row align-center justify-start>
          <v-icon v-if="resizable" class="pr-3" size=20
            @click="$emit('onToggleSize')">
            {{ size === 'minor' ? 'chevron_left' : 'chevron_right' }}
          </v-icon>
          <v-tooltip bottom v-if="$store.state.visPaneCollection === 'history'"
            :disabled="isCreateCollectionTooltipDisabled">
            <h4 class="body-2 d-flex align-center" slot="activator"
              v-on="enableCreateCollection ? { click: createVisPaneCollection } : {}">
              History
              <v-icon v-if="!isCreateCollectionTooltipDisabled" small
                class="pl-1">
                add
              </v-icon>
            </h4>
            <span>Save to new collection</span>
          </v-tooltip>
          <h4 v-else-if="!enableCreateCollection"
            class="body-2 d-flex align-center">
            {{ $store.state.visPaneCollection.title }}
          </h4>
          <input v-else type="text" placeholder="Collection name" @change="$store.commit('setVisPaneCollectionName', $event.target.value)" :value="$store.state.visPaneCollection.title" style="flex: 1;">
          <v-spacer v-if="$store.state.visPaneCollection === 'history' || !enableCreateCollection">
          </v-spacer>
          <v-tooltip bottom>
            <v-icon slot="activator" class="pl-3" size=20
              @click="toggleLevelOfDetail">
              zoom_in
            </v-icon>
            <span>Toggle level of detail</span>
          </v-tooltip>
          <v-tooltip bottom>
            <v-icon slot="activator" class="pl-2" size=20 color="orange"
              id="vis-common-relative"
              :disabled="!$store.state.graph.isAnyNodeSelected"
              @click="findCommonRelatives">
              device_hub
            </v-icon>
            <span>Select cards to find common references and citations</span>
          </v-tooltip>
        </v-layout>
      </v-layout>
    </v-toolbar>
    <v-divider class="my-2"></v-divider>
    <v-container
      class="py-0" fluid style="position: relative;"
      @click="$store.commit('clearSelectedNodes')">
      <v-layout column align-content-start ref="cardLayout"
        :wrap="size !== 'minor'"
        style="height: calc(100vh - 135px); overflow: auto;">
        <div v-for="year in years" :key="year" :id="`vis-year-${year}`">
          <h4 class="text-xs-center column-width">{{ year }}</h4>
          <v-layout
            class="pa-1" align-content-start column :style="cardListStyle">
            <v-hover v-for="(card, index) in cardsByYears[year]" :key="index"
              class="mt-1 mb-2 mx-1">
              <vis-card
                :ref="`card-${card.paper.id}`"
                :id="`vis-card-${card.paper.id}`"
                slot-scope="{ hover }"
                :class="{ 'elevation-6': hover }"
                :card="card">
              </vis-card>
            </v-hover>
          </v-layout>
        </div>
      </v-layout>
      <svg class="overlay" ref="overlay">
        <transition name="card-edge"
          v-for="(curve, index) in refObjEdges" :key="index">
          <path :d="curve"></path>
        </transition>
      </svg>
    </v-container>
  </v-layout>
</template>

<script>
import VisCard from './VisCard.vue'
import _ from 'lodash'
import { Author } from './paper.js'

export default {
  name: 'VisPane',
  components: {
    VisCard
  },
  props: {
    size: String,
    resizable: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      refObjEdges: []
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    },
    formatAuthorNames (authors) {
      return _.map(authors, author => Author.stringify(author))
    },
    findCommonRelatives () {
      const refObjs =
        _.map(this.$store.state.graph.selectedNodes, ({ paper }) => paper)
      this.$store.dispatch('showCommonRelatives', refObjs)
    },
    createVisPaneCollection () {
      if (this.$store.getters.isSignedIn) {
        this.$store.commit('createVisPaneCollection')
      }
    },
    toggleLevelOfDetail () {
      this.$store.commit('toggleVisPaneLOD')
    },
    getRefObjEdges () {
      let nodePairs = []
      if (this.$store.state.showAllRelations) {
        nodePairs =
          _.map(this.$store.state.graph.relations, ({ citing, citedBy }) => ({
            citing: this.$store.state.graph.getNodeById(citing),
            citedBy: this.$store.state.graph.getNodeById(citedBy)
          }))
      } else {
        if (!this.$store.state.hoveredGraphNode) {
          return []
        }
        const hoveredInfo = this.$store.state.hoveredGraphNode
        const relatedNodeIds =
          hoveredInfo.relation === 'citing'
            ? hoveredInfo.node.inGraphCitings
            : hoveredInfo.relation === 'citedBy'
              ? hoveredInfo.node.inGraphCitedBys
              : []
        const getNodeById =
          id =>
            _.find(this.$store.state.graph.nodes, node => node.paper.id === id)
        const relatedNodes = _.map(relatedNodeIds, getNodeById)
        nodePairs = _.map(relatedNodes, relatedNode => {
          return {
            citing:
              hoveredInfo.relation === 'citing' ? relatedNode : hoveredInfo.node,
            citedBy:
              hoveredInfo.relation === 'citing' ? hoveredInfo.node : relatedNode
          }
        })
      }
      const componentPairs = _.map(nodePairs, ({ citing, citedBy }) => {
        return {
          citing: this.$refs[`card-${citing.paper.id}`][0],
          citedBy: this.$refs[`card-${citedBy.paper.id}`][0]
        }
      })
      const marginLeft = 0
      const paths = _.map(componentPairs, ({ citing, citedBy }) => {
        const start = {
          x: citedBy.$el.offsetLeft + marginLeft - this.$refs.cardLayout.scrollLeft,
          y: citedBy.$el.offsetTop + citedBy.$refs.header.$el.offsetHeight / 2 - citedBy.$parent.$el.parentElement.scrollTop - this.$refs.cardLayout.scrollTop
        }
        const end = {
          x: citing.$el.offsetLeft + citing.$el.offsetWidth + marginLeft - this.$refs.cardLayout.scrollLeft,
          y: citing.$el.offsetTop + citedBy.$refs.header.$el.offsetHeight / 2 - citing.$parent.$el.parentElement.scrollTop - this.$refs.cardLayout.scrollTop
        }
        const halfGap = Math.max(16, Math.abs(start.x - end.x) / 4)
        const halfHeader =
          citedBy.$el.offsetTop > citing.$el.offsetTop
            ? citedBy.$refs.header.$el.offsetHeight / 2
            : -citedBy.$refs.header.$el.offsetHeight / 2
        return `M${start.x} ${start.y} C ${start.x - halfGap} ${start.y - halfHeader}, ${end.x + halfGap} ${end.y + halfHeader}, ${end.x} ${end.y}`
      })
      return paths
    }
  },
  computed: {
    cardListStyle () {
      return this.state === 'minor'
        ? {}
        : { maxHeight: 'calc(100vh - 156px)', overflow: 'auto' }
    },
    cardsByYears () {
      let byYears = {}
      for (let i = 0; i < this.$store.state.graph.nodes.length; ++i) {
        const node = this.$store.state.graph.nodes[i]
        const year = node.paper.year
        byYears[year] = byYears[year] || []
        byYears[year].push(node)
      }
      return byYears
    },
    years () {
      let yearNums = _.map(_.keys(this.cardsByYears), _.toNumber)
      yearNums.sort()
      return yearNums
    },
    hoveredGraphNode () {
      return this.$store.state.hoveredGraphNode
    },
    showAllRelations () {
      return this.$store.state.showAllRelations
    },
    enableCreateCollection () {
      return this.$store.state.enableCreateCollection
    },
    isCreateCollectionTooltipDisabled () {
      return !this.isSignedIn || !this.enableCreateCollection
    },
    isSignedIn () {
      return this.$store.getters.isSignedIn
    }
  },
  watch: {
    hoveredGraphNode () {
      this.$nextTick(() => {
        this.refObjEdges = this.getRefObjEdges()
      })
    },
    showAllRelations () {
      this.$nextTick(() => {
        this.refObjEdges = this.getRefObjEdges()
      })
    }
  }
}
</script>

<style scoped>
.column-width {
  min-width: 252px;
  max-width: 252px;
}

.overlay {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgb(100, 100, 200, 0);
  /*opacity: 0.3;*/
  pointer-events: none;
}

.overlay path {
  stroke: #a55;
  fill: none;
  stroke-opacity: 0.7;
  stroke-width: 5px;
  stroke-linecap: round;
}

.card-edge-leave-active {
  transition: opacity 1s ease-in;
}

.card-edge-leave-to, .card-edge-enter {
  opacity: 0;
}
</style>
