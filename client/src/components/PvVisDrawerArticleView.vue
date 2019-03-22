<template>
  <v-container-with-scroll fluid grid-list-md
    :is-at-bottom.sync="isAtContainerBottom"
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
        <pv-vis-drawer-article-cards-infinite-scroll class="pa-0"
          :style="relationCardsContainerStyle" :articleIds="referenceIds"
          :card-config="cardConfig"
          :get-card-cited-by-color="getCardCitedByColor"
          :get-card-reference-color="getCardReferenceColor"
          :hovering-article-id.sync="referenceListHoveringArticleId"
          @click-card="onCardClicked">
        </pv-vis-drawer-article-cards-infinite-scroll>
      </v-flex>
      <v-flex xs6 pa-0>
        <v-flex tag="h4" shrink class="font-weight-bold">
          Cited by ({{ meta.nCitedBys }})
        </v-flex>
        <pv-vis-drawer-article-cards-infinite-scroll class="pa-0"
          :style="relationCardsContainerStyle" :articleIds="citedByIds"
          :card-config="cardConfig"
          :get-card-cited-by-color="getCardCitedByColor"
          :get-card-reference-color="getCardReferenceColor"
          :hovering-article-id.sync="citedByListHoveringArticleId"
          @click-card="onCardClicked">
        </pv-vis-drawer-article-cards-infinite-scroll>
      </v-flex>
    </v-layout>
  </v-container-with-scroll>
</template>

<script>
import _ from 'lodash'
import ExpandableText from './ExpandableText.vue'
import PvExpandableAuthorsLinks from './PvExpandableAuthorsLinks.vue'
import PvVisCard from './PvVisCard.vue'
import PvVisDrawerArticleCardsInfiniteScroll from './PvVisDrawerArticleCardsInfiniteScroll.vue'
import theArticlePool from './pvarticlepool.js'
import withScroll from './withscroll.js'
import { Article, Paper, Venue } from './pvmodels.js'
import { mapState } from 'vuex'

const VContainerWithScroll = withScroll('v-container')

export default {
  name: 'PvVisDrawerArticleView',
  components: { ExpandableText, PvExpandableAuthorsLinks, PvVisCard, PvVisDrawerArticleCardsInfiniteScroll, VContainerWithScroll },
  props: {
    articleId: String,
    cardConfig: Object,
    getCardCitedByColor: Function,
    getCardReferenceColor: Function,
    hoveringArticleId: String
  },
  data () {
    return {
      abstractTextLimit: 200,
      citedByListHoveringArticleId: null,
      isAtContainerBottom: false,
      referenceListHoveringArticleId: null
    }
  },
  computed: {
    ...mapState('parseVis', [ 'articleEditable' ]),
    firstAuthorSurname () {
      const firstAuthor = _.first(this.meta.data.authors)
      return firstAuthor ? firstAuthor.surname : ''
    },
    internalHoveringArticleId () {
      return this.referenceListHoveringArticleId ||
        this.citedByListHoveringArticleId
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
    citedByIds: {
      default: [],
      async get () {
        return theArticlePool.getCitedByIds(this.articleId)
      }
    },
    referenceIds: {
      default: [],
      async get () {
        return theArticlePool.getReferenceIds(this.articleId)
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
  },
  watch: {
    articleId () {
      this.$el.scrollTop = 0
      this.referenceListHoveringArticleId = null
      this.citedByListHoveringArticleId = null
    },
    internalHoveringArticleId (curr) {
      this.$emit('update:hoveringArticleId', curr)
    }
  }
}
</script>

<style scoped>
</style>
