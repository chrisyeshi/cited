<template>
  <v-layout column>
    <v-toolbar dense flat class="pb-0" color="transparent">
      <v-layout fill-height align-end>
        <v-layout row wrap align-center>
          <v-flex xs1>
            <v-icon @click="$store.dispatch('toggleVisPaneState')">
              {{ $store.state.visPaneState === 'full'
                ? 'chevron_right'
                : 'chevron_left' }}
            </v-icon>
          </v-flex>
          <v-flex offset-xs1>
            <h4 class="body-2">History</h4>
          </v-flex>
        </v-layout>
      </v-layout>
    </v-toolbar>
    <v-divider class="my-2"></v-divider>
    <v-container class="py-0" fluid>
      <v-layout column align-content-start
        :wrap="$store.state.visPaneState !== 'minor'"
        style="height: calc(100vh - 135px); overflow: auto;">
        <div v-for="year in years" :key="year">
          <h4 class="text-xs-center">{{ year }}</h4>
          <v-hover v-for="(card, index) in cardsByYears[year]" :key="index"
          class="ma-2">
            <v-card slot-scope="{ hover }" :class="{ 'elevation-6': hover }" style="min-width: 252px; max-width: 252px;">
              <v-system-bar status class="pa-0">
                <span class="fill-height caption px-1 d-flex align-center cyan darken-3">
                  <span>&lt; {{ card.inGraphCitings.length }} / {{ card.paper.citingCount }}</span>
                </span>
                <v-spacer></v-spacer>
                <v-icon @click="trace">close</v-icon>
                <span class="fill-height caption px-1 d-flex align-center cyan darken-1">
                  <span>{{ card.inGraphCitedBys.length }} / {{ card.paper.citedByCount }} &gt;</span>
                </span>
              </v-system-bar>
              <v-card-text class="pa-2 caption">
                <h4><a>{{ card.paper.title }}</a></h4>
                <div class="text-truncate paper-author-line">
                  <span v-for="(name, index) in formatAuthorNames(card.paper.authors)" :key="index">
                    <a class="text-no-wrap">{{ name }}</a>
                    <span v-if="index !== card.paper.authors.length - 1">
                      and
                    </span>
                  </span>
                  <!-- <a>Ye, Yucong (Chris)</a> and <a>Moreland, Kenneth</a> and <a>Li Kelvin</a> -->
                </div>
                <v-layout row justify-space-between>
                  <a class="text-truncate" style="max-width: 60px;">{{ card.paper.venue }}</a>-<a>{{ card.paper.year }}</a>-<a>Citing {{ card.paper.citingCount }}</a>-<a>Cited by {{ card.paper.citedByCount }}</a>
                </v-layout>
              </v-card-text>
            </v-card>
          </v-hover>
        </div>
      </v-layout>
    </v-container>
  </v-layout>
</template>

<script>
import PaperCard from './PaperCard.vue'
import _ from 'lodash'
import { Author } from './paper.js'

export default {
  name: 'VisPane',
  components: {
    PaperCard
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    },
    formatAuthorNames (authors) {
      return _.map(authors, author => Author.stringify(author))
    }
  },
  computed: {
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
    }
  }
}
</script>

<style scoped>
.paper-author-line a {
  text-decoration: underline;
  color: dimgray;
}
</style>
