<template>
  <div>
    <v-toolbar flat color="white">
      <v-toolbar-side-icon @click="back">
        <v-icon>arrow_back</v-icon>
      </v-toolbar-side-icon>
      <v-toolbar-title v-if="art">{{ artLabel }}</v-toolbar-title>
      <v-toolbar-title v-else>
        <v-progress-circular indeterminate></v-progress-circular>
      </v-toolbar-title>
    </v-toolbar>
    <v-container fluid grid-list-md pa-3>
      <v-layout column>
        <v-flex>
          <v-tooltip v-for="(artStat, index) in artStats" :key="index" bottom>
            <template v-slot:activator="{ on }">
              <v-btn small round depressed v-on="on" class="ma-1"
                :color="artStat.color">
                {{ artStat.label }}
              </v-btn>
            </template>
            <span>{{ artStat.tooltip }}</span>
          </v-tooltip>
        </v-flex>
        <v-flex tag="h3" class="headline">{{ title }}</v-flex>
        <v-flex class="font-weight-medium">
          <pv-expandable-authors-links :authors="authors">
          </pv-expandable-authors-links>
        </v-flex>
        <v-flex class="font-weight-light">
          <pv-drawer-article-stats-row :venue="venue" :year="year"
            :nReferences="nReferences" :nCitedBys="nCitedBys">
          </pv-drawer-article-stats-row>
        </v-flex>
        <v-flex class="font-weight-thin">
          <expandable-text :text="abstract" :textLimit="abstractLimit">
          </expandable-text>
        </v-flex>
        <v-layout row>
          <v-flex xs6>
            <v-flex tag="h4" shrink class="font-weight-bold">
              References ({{ nReferences }})
            </v-flex>
            <v-flex v-for="art in references" :key="art.artHash"
              style="font-size: 12px;">
              <pv-drawer-article-relative-card
                :art="art" @click="onClickArticle(art.artHash)">
              </pv-drawer-article-relative-card>
            </v-flex>
            <v-flex class="text-xs-center">
              <v-btn small flat color="primary"
                @click="onClickMoreRelatives('references')">
                More
              </v-btn>
            </v-flex>
          </v-flex>
          <v-flex xs6>
            <v-flex tag="h4" shrink class="font-weight-bold">
              Cited by ({{ nCitedBys }})
            </v-flex>
            <v-flex v-for="art in citedBys" :key="art.artHash"
              style="font-size: 12px;">
              <pv-drawer-article-relative-card
                :art="art" @click="onClickArticle(art.artHash)">
              </pv-drawer-article-relative-card>
            </v-flex>
            <v-flex class="text-xs-center">
              <v-btn small flat color="primary"
                @click="onClickMoreRelatives('citedBys')">
                More
              </v-btn>
            </v-flex>
          </v-flex>
        </v-layout>
      </v-layout>
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
    art () {
      return this.currArt || this.visGraph.getArt(this.currArtId)
    },
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
      this.$router.push(`/coll/${this.currCollId}/${this.currArtId}/references`)
    },
    trace (value) {
      console.log(value)
      return value
    }
  }
}
</script>
