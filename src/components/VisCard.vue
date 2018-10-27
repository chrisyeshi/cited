<template>
  <v-card class="column-width">
    <v-system-bar status class="pa-0"
      :style="{ 'background-color': color }">
      <!-- TODO: hove over these to highlight the related cards in graph -->
      <span class="fill-height caption px-1 d-flex align-center cyan darken-3">
        <span>
          &lt; {{ card.inGraphCitings.length }} / {{ card.paper.citingCount }}
        </span>
      </span>
      <v-spacer
        @click="$store.commit('toggleNodeSelected', card)" class="fill-height">
      </v-spacer>
      <v-icon @click="$store.commit('removeFromGraph', card)">close</v-icon>
      <span class="fill-height caption px-1 d-flex align-center cyan darken-1">
        <span>
          {{ card.inGraphCitedBys.length }} / {{ card.paper.citedByCount }} &gt;
        </span>
      </span>
    </v-system-bar>
    <v-card-text class="pa-2 caption">
      <h4><a>{{ card.paper.title }}</a></h4>
      <div class="text-truncate paper-author-line">
        <span v-for="(name, index) in formatAuthorNames(card.paper.authors)"
          :key="index">
          <a class="text-no-wrap">{{ name }}</a>
          <span v-if="index !== card.paper.authors.length - 1">
            and
          </span>
        </span>
      </div>
      <v-layout row justify-space-between>
        <a class="text-truncate" style="max-width: 60px;">
          {{ card.paper.venue }}
        </a>
        -
        <a>{{ card.paper.year }}</a>
        -
        <a @click="showCitingRefObjs(card.paper)">
          Citing {{ card.paper.citingCount }}
        </a>
        -
        <a @click="showCitedByRefObjs(card.paper)">
          Cited by {{ card.paper.citedByCount }}
        </a>
      </v-layout>
    </v-card-text>
  </v-card>
</template>

<script>
import { Author } from './paper.js'
import _ from 'lodash'

export default {
  name: 'VisCard',
  props: {
    card: Object
  },
  data () {
    return {
      color: undefined
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
    showCitingRefObjs (refObj) {
      this.$store.dispatch(
        'showRelatedTestRefObjs', { relation: 'citing', refObj: refObj })
    },
    showCitedByRefObjs (refObj) {
      this.$store.dispatch(
        'showRelatedTestRefObjs', { relation: 'citedBy', refObj: refObj })
    }
  },
  watch: {
    card (curr) {
      this.color = curr.isSelected ? 'orange' : undefined
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
