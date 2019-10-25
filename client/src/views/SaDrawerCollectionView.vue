<template>
  <div>
    <v-toolbar flat color="white">
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
            :nReferences="nReference" :nCitedBys="nCitedBy" />
        </v-col>
      </v-row>
      <v-row class="font-weight-thin">
        <v-col class="py-1">
          <expandable-text :text="abstract" :textLimit="abstractLimit" />
        </v-col>
      </v-row>
      <v-row class="font-weight-medium">
        <v-col class="py-1">
          References ({{ nReference }})
        </v-col>
      </v-row>
      <v-list three-line style="margin-left: -12px; margin-right: -12px;">
        <pv-drawer-article-list-tile v-for="art in collArts" :key="art.artHash"
          :art="art" @click="onClickArticle(art.artHash)">
        </pv-drawer-article-list-tile>
      </v-list>
    </v-container>
  </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import ExpandableText from '@/components/ExpandableText.vue'
import PvDrawerArticleListTile from '@/components/PvDrawerArticleListTile'
import PvDrawerArticleStatsRow from '@/components/PvDrawerArticleStatsRow.vue'
import PvExpandableAuthorsLinks from '@/components/PvExpandableAuthorsLinks.vue'
import { VisGraph } from '@/components/visgraph.js'

export default {
  name: 'PvDrawerArticleView',
  components: {
    ExpandableText, PvDrawerArticleListTile, PvDrawerArticleStatsRow,
    PvExpandableAuthorsLinks
  },
  data: () => ({
    abstractLimit: 200
  }),
  computed: {
    ...mapState('parseVis', [ 'currCollId', 'currColl', 'currVisGraph' ]),
    art () {
      return _.property('citedBy')(this.currColl)
    },
    artLabel () {
      return this.title
        ? `${this.firstAuthorSurname} ${this.year}`
        : this.currArtId
    },
    artStats () {
      const stats = []
      if (_.isNil(_.property('title')(this.art))) {
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
      const referenceArtHashes = _.property('referenceArtHashes')(this.art)
      if (_.isNil(nReference) || _.size(referenceArtHashes) < nReference) {
        stats.push({
          label: 'references',
          tooltip: 'missing reference(s)',
          color: 'warning'
        })
      }
      return stats
    },
    abstract () { return this.art && this.art.abstract },
    authors () {
      return _.property('authors')(this.art) || []
    },
    currArtId () { return _.property('artHash')(this.art) },
    firstAuthorSurname () {
      return this.art && this.art.authors && this.art.authors[0] &&
        this.art.authors[0].surname
    },
    collArts () {
      return _.property('articles')(this.currColl)
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
    }
  }
}
</script>
