<template>
  <v-card class="column-width">
    <v-system-bar status class="pa-0" ref="header"
      :class="{ orange: card.isSelected }">
      <v-tooltip top class="fill-height" open-delay=500>
        <span class="fill-height caption px-1 d-flex align-center white--text"
          :style="{ backgroundColor: inGraphCitingColor }"
          style="cursor: pointer;"
          slot="activator"
          @mouseover="setHovered(card, 'citing', true)"
          @mouseout="setHovered(card, 'citing', false)"
          @click="showRelatedRefObjs('citedBy', card.paper, false)">
          <span>
            &lt; {{ card.inGraphCitings.length }} / {{ card.paper.citingCount }}
          </span>
        </span>
        <span>Citing {{ card.inGraphCitings.length }} articles in collection and {{ card.paper.citingCount }} articles overall</span>
      </v-tooltip>
      <v-spacer
        @click.stop="$store.commit('toggleNodeSelected', card)"
        class="fill-height px-2 d-flex align-center text-truncate body-1">
        <span v-if="lod === 'author'">
          {{ formatAuthorNames(card.paper.authors)[0].slice(0, 10) }}, {{ card.paper.year }}
        </span>
      </v-spacer>
      <v-icon @click="$store.commit('removeFromGraph', card)">close</v-icon>
      <v-tooltip top class="fill-height" open-delay=500>
        <span class="fill-height caption px-1 d-flex align-center white--text"
          :style="{ backgroundColor: inGraphCitedByColor }"
          style="cursor: pointer;"
          slot="activator"
          @mouseover="setHovered(card, 'citedBy', true)"
          @mouseout="setHovered(card, 'citedBy', false)"
          @click="showRelatedRefObjs('citing', card.paper, false)">
          <span>
            {{ card.inGraphCitedBys.length }} / {{ card.paper.citedByCount }} &gt;
          </span>
        </span>
        <span>Cited by {{ card.inGraphCitedBys.length }} articles in collection and {{ card.paper.citedByCount }} articles overall</span>
      </v-tooltip>
    </v-system-bar>
    <v-card-text v-if="lod !== 'author'" class="pa-2 caption">
      <h4>
        <a @click="$store.dispatch('setCurrRefObj', card.paper.id)">
          {{ card.paper.title }}
        </a>
      </h4>
      <div v-if="lod !== 'title'" class="text-truncate paper-author-line">
        <span v-for="(name, index) in formatAuthorNames(card.paper.authors)"
          :key="index">
          <a class="text-no-wrap">{{ name }}</a>
          <span v-if="index !== card.paper.authors.length - 1">
            and
          </span>
        </span>
      </div>
      <v-layout v-if="lod !== 'title'" row justify-space-between>
        <a class="text-truncate" style="max-width: 60px;">
          {{ card.paper.venue.name }}
        </a>
        -
        <a>{{ card.paper.year }}</a>
        -
        <a @click="showRelatedRefObjs('citedBy', card.paper, false)">
          Referenced {{ card.paper.citingCount }}
        </a>
        -
        <a @click="showRelatedRefObjs('citing', card.paper, false)">
          Cited by {{ card.paper.citedByCount }}
        </a>
      </v-layout>
    </v-card-text>
  </v-card>
</template>

<script>
import { Author } from './paper.js'
import _ from 'lodash'
import showRelatedRefObjs from './showrelatedrefobjs.js'

export default {
  name: 'VisCard',
  mixins: [
    showRelatedRefObjs
  ],
  props: {
    card: Object
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    },
    formatAuthorNames (authors) {
      return _.map(authors, author => Author.stringify(author))
    },
    getColor: function ({ maxLevel, logBase, value }) {
      const log = x => Math.log(x) / Math.log(logBase)
      const count = Math.floor(value)
      const unboundLevel = count === 0 ? 0 : Math.floor(log(count)) + 1
      const boundLevel = Math.min(maxLevel, unboundLevel)
      const r = boundLevel / maxLevel
      const minColor = [50, 50, 50]
      const maxColor = [50, 200, 250]
      const color = []
      for (let i = 0; i < 3; ++i) {
        color[i] = minColor[i] * (1 - r) + maxColor[i] * r
      }
      return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
    },
    setHovered (card, relation, hovered) {
      this.$store.commit(
        'setHoveredGraphNode',
        hovered ? { node: card, relation: relation } : null)
    }
  },
  computed: {
    inGraphCitingColor () {
      return this.getColor({
        maxLevel: 4,
        logBase: 2,
        value: this.card.inGraphCitings.length
      })
    },
    inGraphCitedByColor () {
      return this.getColor({
        maxLevel: 4,
        logBase: 2,
        value: this.card.inGraphCitedBys.length
      })
    },
    lod () {
      return this.$store.state.visPaneLOD
    }
  }
}
</script>

<style scoped>
.paper-author-line a {
  text-decoration: underline;
  color: dimgray;
}

.column-width {
  min-width: 252px;
  max-width: 252px;
}
</style>
