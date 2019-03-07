<template>
  <v-container fluid grid-list-md>
    <v-layout column>
      <v-layout row ma-0 justify-start>
        <v-flex tag="a" shrink @click="$emit('edit-clicked', $event)">
          EDIT
        </v-flex>
        <v-flex shrink>-</v-flex>
        <v-flex tag="a" shrink>ADD TO</v-flex>
      </v-layout>
      <v-flex tag="h3" class="headline font-weight-light">
        {{ meta.data.title }}
      </v-flex>
      <v-flex>
        <pv-expandable-authors-links :authors="meta.data.authors">
        </pv-expandable-authors-links>
      </v-flex>
      <v-flex tag=a class="text-truncate font-weight-medium">
        {{ meta.data.year }}, {{ meta.data.venue ? meta.data.venue.name : '' }}
      </v-flex>
      <v-flex class="text-truncate font-weight-medium">
        <a>References {{ meta.nReferences }}</a> - <a>Cited by {{ meta.nCitedBys }}</a>
      </v-flex>
      <v-flex tag="h4" class="font-weight-bold">Abstract</v-flex>
      <v-flex>
        <expandable-text :text="meta.data.abstract"
          :text-limit="abstractTextLimit">
        </expandable-text>
      </v-flex>
      <v-layout row>
        <v-flex xs6>
          <v-flex tag="h4" shrink class="font-weight-bold">
            References ({{ meta.nReferences }})
          </v-flex>
          <v-flex v-for="(referenceArticle, index) in references"
            :key="index" shrink class="caption">
            <pv-vis-card :article="referenceArticle" :config="cardConfig"
              :style="cardStyle"
              :referenceColor="getCardReferenceColor(referenceArticle)"
              :citedByColor="getCardCitedByColor(referenceArticle)">
            </pv-vis-card>
          </v-flex>
        </v-flex>
        <v-flex xs6>
          <v-flex tag="h4" shrink class="font-weight-bold">
            Cited by ({{ meta.nCitedBys }})
          </v-flex>
          <v-flex v-for="(citedByArticle, index) in citedBys"
            :key="index" shrink class="caption">
            <pv-vis-card :article="citedByArticle" :config="cardConfig"
              :style="cardStyle"
              :referenceColor="getCardReferenceColor(citedByArticle)"
              :citedByColor="getCardCitedByColor(citedByArticle)">
            </pv-vis-card>
          </v-flex>
        </v-flex>
      </v-layout>
    </v-layout>
  </v-container>
</template>

<script>
import _ from 'lodash'
import ExpandableText from './ExpandableText.vue'
import PvExpandableAuthorsLinks from './PvExpandableAuthorsLinks.vue'
import PvVisCard from './PvVisCard.vue'
import theArticlePool from './pvarticlepool.js'
import { Article, Paper, Venue } from './pvmodels.js'

export default {
  name: 'PvVisDrawerArticleView',
  components: {
    ExpandableText, PvExpandableAuthorsLinks, PvVisCard
  },
  props: {
    articleId: String,
    cardConfig: Object,
    getCardCitedByColor: Function,
    getCardReferenceColor: Function
  },
  data () {
    return {
      abstractTextLimit: 200
    }
  },
  computed: {
    cardStyle () {
      return {
        height: `${this.cardConfig.height}${this.cardConfig.unit}`
      }
    }
  },
  asyncComputed: {
    meta: {
      default: new Article('', '', new Paper('', '', 0, [], new Venue(''))),
      async get () {
        return theArticlePool.getMeta(this.articleId)
      }
    },
    references: {
      default: [],
      async get () {
        const refArtIds = await theArticlePool.getReferenceIds(this.articleId)
        return Promise.all(
          _.map(refArtIds, artId => theArticlePool.getMeta(artId)))
      }
    },
    citedBys: {
      default: [],
      async get () {
        const citedByArtIds = await theArticlePool.getCitedByIds(this.articleId)
        return Promise.all(
          _.map(citedByArtIds, artId => theArticlePool.getMeta(artId)))
      }
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    }
  }
}
</script>

<style scoped>
</style>
