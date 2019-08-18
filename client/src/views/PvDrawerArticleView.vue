<template>
  <div>
    <v-toolbar flat color="white">
      <v-app-bar-nav-icon @click="back">
        <v-icon>mdi-arrow-left</v-icon>
      </v-app-bar-nav-icon>
      <v-toolbar-title v-if="art">{{ artLabel }}</v-toolbar-title>
      <v-toolbar-title v-else>
        <v-progress-circular indeterminate></v-progress-circular>
      </v-toolbar-title>
    </v-toolbar>
    <v-container fluid class="body-2">
      <v-row class="mx-0">
        <v-tooltip v-for="(artStat, index) in artStats" :key="index" bottom>
          <template v-slot:activator="{ on }">
            <v-chip small v-on="on" :color="artStat.color" class="mx-1"
              :class="{ 'ml-0': index === 0 }">
              {{ artStat.label }}
            </v-chip>
          </template>
          <span>{{ artStat.tooltip }}</span>
        </v-tooltip>
      </v-row>
      <v-row tag="h3" class="headline">
        <v-col class="py-1">{{ title }}</v-col>
      </v-row>
      <v-row class="font-weight-medium">
        <v-col class="py-1">
          <pv-expandable-authors-links :authors="authors" />
        </v-col>
      </v-row>
      <v-row class="font-weight-light">
        <v-col class="py-1">
          <pv-drawer-article-stats-row :venue="venue" :year="year"
            :nReferences="nReferences" :nCitedBys="nCitedBys" />
        </v-col>
      </v-row>
      <v-row class="font-weight-thin">
        <v-col class="py-1">
          <expandable-text :text="abstract" :textLimit="abstractLimit" />
        </v-col>
      </v-row>
      <v-row class="mx-0">
        <v-col cols=6 class="pr-1">
          <v-row tag="h4" shrink class="font-weight-bold my-2 mr-0">
            References ({{ nReferences }})
          </v-row>
          <v-row v-for="art in references" :key="art.artHash"
            class="my-2 mr-0" style="font-size: 12px;">
            <pv-drawer-article-relative-card
              :art="art" @click="onClickArticle(art.artHash)" />
          </v-row>
          <v-row class="my-2 mr-0" justify="center">
            <v-btn small text rounded outlined color="primary"
              @click="onClickMoreRelatives('references')">
              More
            </v-btn>
          </v-row>
        </v-col>
        <v-col cols=6 class="pl-1">
          <v-row tag="h4" shrink class="font-weight-bold my-2 ml-0">
            Cited by ({{ nCitedBys }})
          </v-row>
          <v-row v-for="art in citedBys" :key="art.artHash"
            class="my-2 ml-0" style="font-size: 12px;">
            <pv-drawer-article-relative-card
              :art="art" @click="onClickArticle(art.artHash)">
            </pv-drawer-article-relative-card>
          </v-row>
          <v-row class="my-2 ml-0" justify="center">
            <v-btn small text rounded outlined color="primary"
              @click="onClickMoreRelatives('citedBys')">
              More
            </v-btn>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import ExpandableText from '@/components/ExpandableText.vue'
import PvDrawerArticleRelativeCard from '@/components/PvDrawerArticleRelativeCard.vue'
import PvDrawerArticleStatsRow from '@/components/PvDrawerArticleStatsRow.vue'
import PvExpandableAuthorsLinks from '@/components/PvExpandableAuthorsLinks.vue'
import { VisGraph } from '@/components/visgraph.js'

export default {
  name: 'PvDrawerArticleView',
  components: {
    ExpandableText,
    PvDrawerArticleRelativeCard,
    PvDrawerArticleStatsRow,
    PvExpandableAuthorsLinks
  },
  data: () => ({
    abstractLimit: 200
  }),
  computed: {
    ...mapState('parseVis', [
      'currCollId', 'currVisGraph', 'currArtId', 'currArt'
    ]),
    art () { return this.currArt || this.visGraph.getArt(this.currArtId) },
    artLabel () { return `${this.firstAuthorSurname} ${this.year}` },
    artStats () {
      const stats = []
      if (!this.currArt) {
        stats.push({
          label: 'db',
          tooltip: 'article not in database',
          color: 'error'
        })
      }
      if (_.isNil(_.property('title')(this.art)) ||
        _.isNil(_.property('authors[0].surname')(this.art)) ||
        _.isNil(_.property('year')(this.art))) {
        stats.push({
          label: 'meta',
          tooltip: 'missing title, first author, or year',
          color: 'error'
        })
      }
      if (_.isNil(_.property('abstract')(this.art)) ||
        _.isNil(_.property('venue')(this.art)) ||
        _.isNil(this.nCitedBy)) {
        stats.push({
          label: 'info',
          tooltip: 'missing article information',
          color: 'warning'
        })
      }
      const nReference = this.nReference
      const references = this.references
      if (_.isNil(nReference) || _.size(references) < nReference) {
        stats.push({
          label: 'references',
          tooltip: 'missing reference(s)',
          color: 'warning'
        })
      }
      return stats
    },
    abstract () { return this.art && this.art.abstract },
    authors () { return this.art ? this.art.authors : [] },
    firstAuthorSurname () {
      return this.art && this.art.authors && this.art.authors[0] &&
        this.art.authors[0].surname
    },
    citedBys () {
      const arts =
        _.property('citedBys')(this.art) ||
        this.visGraphCitedByArts || []
      return _.slice(arts, 0, 3)
    },
    references () {
      const arts =
        _.property('references')(this.art) ||
        this.visGraphReferenceArts || []
      return _.slice(arts, 0, 3)
    },
    nCitedBy () {
      return _.property('nCitedBys')(this.art) ||
        _.property('nCitedBy')(this.art)
    },
    nCitedBys () { return this.art && this.art.nCitedBys },
    nReference () {
      return _.property('nReference')(this.art) ||
        _.property('nReferences')(this.art)
    },
    nReferences () { return this.art && this.art.nReferences },
    title () { return this.art && this.art.title },
    venue () {
      return _.property('art.venue.name')(this) ||
        _.property('art.venues[0].name')(this) || ''
    },
    visGraph () {
      return this.currVisGraph || new VisGraph()
    },
    visGraphCitedByArts () {
      return _.map(
        this.visGraph.getInGraphCitedByIds(this.currArtId),
        artHash => this.visGraph.getArt(artHash))
    },
    visGraphReferenceArts () {
      return _.map(
        this.visGraph.getInGraphReferenceIds(this.currArtId),
        artHash => this.visGraph.getArt(artHash))
    },
    year () { return this.art && this.art.year }
  },
  methods: {
    back () {
      this.$router.push(`/coll/${this.currCollId}`)
    },
    onClickArticle (artId) {
      this.$router.push(`/coll/${this.currCollId}/${artId}`)
    },
    onClickMoreRelatives (relationProp) {
      this.$router.push(
        `/coll/${this.currCollId}/${this.currArtId}/${relationProp}`)
    },
    trace (value) {
      console.log(value)
      return value
    }
  }
}
</script>
