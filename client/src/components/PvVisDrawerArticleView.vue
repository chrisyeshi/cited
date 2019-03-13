<template>
  <v-container fluid grid-list-md id="pv-vis-drawer-article-view-container"
    style="position: relative; height: 100%; overflow: auto;">
    <v-layout column style="position: relative; overflow: auto;">
      <v-layout row ma-0 justify-end>
        <v-flex class="font-weight-bold" style="margin-right: auto;">
          {{firstAuthorSurname}} {{meta.data.year}}
        </v-flex>
        <v-flex tag="a" shrink @click="$emit('back-clicked', $event)">
          BACK
        </v-flex>
        <v-flex shrink>-</v-flex>
        <v-flex v-if="articleEditable" tag="a" shrink
          @click="$emit('edit-clicked', $event)">
          EDIT
        </v-flex>
        <v-flex v-if="articleEditable" shrink>-</v-flex>
        <v-flex tag="a" shrink @click="$emit('add-to-vis', articleId)">
          ADD TO VISUALIZATION
        </v-flex>
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
        <expandable-text :text="meta.data.abstract || ''"
          :text-limit="abstractTextLimit">
        </expandable-text>
      </v-flex>
    </v-layout>
    <v-layout row style="height: 100%;">
      <v-flex xs6 pa-0 style="height: 100%;">
        <v-flex tag="h4" shrink class="font-weight-bold">
          References ({{ meta.nReferences }})
        </v-flex>
        <v-flex pa-0 :style="relationCardsContainerStyle">
          <v-flex v-for="(referenceArticle, index) in references"
            :key="index" shrink class="caption">
            <pv-vis-card :article="referenceArticle" :config="cardConfig"
              :style="cardStyle"
              :referenceColor="getCardReferenceColor(referenceArticle)"
              :citedByColor="getCardCitedByColor(referenceArticle)"
              @click.native="onCardClicked(referenceArticle.id)">
            </pv-vis-card>
          </v-flex>
        </v-flex>
      </v-flex>
      <v-flex xs6 pa-0>
        <v-flex tag="h4" shrink class="font-weight-bold">
          Cited by ({{ meta.nCitedBys }})
        </v-flex>
        <v-flex pa-0 :style="relationCardsContainerStyle">
          <v-flex v-for="(citedByArticle, index) in citedBys"
            :key="index" shrink class="caption">
            <pv-vis-card :article="citedByArticle" :config="cardConfig"
              :style="cardStyle"
              :referenceColor="getCardReferenceColor(citedByArticle)"
              :citedByColor="getCardCitedByColor(citedByArticle)"
              @click.native="onCardClicked(citedByArticle.id)">
            </pv-vis-card>
          </v-flex>
        </v-flex>
      </v-flex>
    </v-layout>
    <container-with-on-scroll :is-at-bottom.sync="isAtContainerBottom">
    </container-with-on-scroll>
  </v-container>
</template>

<script>
import _ from 'lodash'
import createWithOnScroll from './PvWithOnScroll.js'
import ExpandableText from './ExpandableText.vue'
import PvExpandableAuthorsLinks from './PvExpandableAuthorsLinks.vue'
import PvVisCard from './PvVisCard.vue'
import theArticlePool from './pvarticlepool.js'
import { Article, Paper, Venue } from './pvmodels.js'
import { mapState } from 'vuex'

const ContainerWithOnScroll =
  createWithOnScroll('#pv-vis-drawer-article-view-container')

export default {
  name: 'PvVisDrawerArticleView',
  components: {
    ContainerWithOnScroll, ExpandableText, PvExpandableAuthorsLinks, PvVisCard
  },
  props: {
    articleId: String,
    cardConfig: Object,
    getCardCitedByColor: Function,
    getCardReferenceColor: Function
  },
  data () {
    return {
      abstractTextLimit: 200,
      isAtContainerBottom: false
    }
  },
  computed: {
    ...mapState('parseVis', [ 'articleEditable' ]),
    cardStyle () {
      return {
        cursor: 'pointer',
        height: `${this.cardConfig.height}${this.cardConfig.unit}`
      }
    },
    firstAuthorSurname () {
      const firstAuthor = _.first(this.meta.data.authors)
      return firstAuthor ? firstAuthor.surname : ''
    },
    relationCardsContainerStyle () {
      return {
        'max-height': 'calc(100% - 29px)',
        overflow: this.isAtContainerBottom ? 'auto' : 'hidden'
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
        const allRefArtIds =
          await theArticlePool.getReferenceIds(this.articleId)
        // TODO: pagination of reference articles
        const refArtIds = _.slice(allRefArtIds, 0, 10)
        return Promise.all(
          _.map(refArtIds, artId => theArticlePool.getMeta(artId)))
      }
    },
    citedBys: {
      default: [],
      async get () {
        const allCitedByArtIds =
          await theArticlePool.getCitedByIds(this.articleId)
        // TODO: pagination of cited by articles
        const citedByArtIds = _.slice(allCitedByArtIds, 0, 10)
        return Promise.all(
          _.map(citedByArtIds, artId => theArticlePool.getMeta(artId)))
      }
    }
  },
  methods: {
    onCardClicked (artId) {
      this.$emit('select-article', artId)
    },
    trace (value) {
      console.log(value)
      return value
    }
  }
}
</script>

<style scoped>
</style>
