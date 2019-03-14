<template>
  <v-flex @scroll="onScroll">
    <v-flex v-for="article in currArticles" :key="article.id" shrink
      class="caption">
      <pv-vis-card :article="article" :config="cardConfig" :style="cardStyle"
        :referenceColor="getCardReferenceColor(article)"
        :citedByColor="getCardCitedByColor(article)"
        @click.native="$emit('click-card', article.id)">
      </pv-vis-card>
    </v-flex>
    <pv-load-more-combo v-bind="loadStatus" @load-more="onLoadMore">
    </pv-load-more-combo>
  </v-flex>
</template>

<script>
import _ from 'lodash'
import PvLoadMoreCombo from './PvLoadMoreCombo.vue'
import PvVisCard from './PvVisCard.vue'
import theArticlePool from './pvarticlepool.js'

export default {
  name: 'PvVisDrawerArticleCardsInfiniteScroll',
  components: { PvLoadMoreCombo, PvVisCard },
  props: {
    articleIds: Array,
    articleCountPerLoad: {
      type: Number,
      default: 5
    },
    cardConfig: Object,
    getCardCitedByColor: Function,
    getCardReferenceColor: Function
  },
  data () {
    return {
      articleSliceCount: this.articleCountPerLoad,
      currArticles: [],
      loadStatus: {
        isDone: false,
        isEmpty: false,
        isLoadingMore: false
      }
    }
  },
  computed: {
    cardStyle () {
      return {
        cursor: 'pointer',
        height: `${this.cardConfig.height}${this.cardConfig.unit}`
      }
    },
    currArtIds () {
      return _.slice(this.articleIds, 0, this.articleSliceCount)
    }
  },
  methods: {
    async fetchArticles () {
      this.loadStatus = { ...this.loadStatus, isLoadingMore: true }
      this.currArticles =
        await Promise.all(
          _.map(this.currArtIds, artId => theArticlePool.getMeta(artId)))
      this.loadStatus = {
        isDone: this.articleIds.length !== 0 &&
          this.articleIds.length === this.currArticles.length,
        isEmpty: this.articleIds.length === 0,
        isLoadingMore: false
      }
    },
    onLoadMore () {
      this.articleSliceCount += this.articleCountPerLoad
      this.fetchArticles()
    },
    onScroll ({ target }) {
      const scrollPos = target.scrollHeight - target.scrollTop
      const isAtBottom = scrollPos <= target.offsetHeight
      if (isAtBottom) {
        this.onLoadMore()
      }
    }
  },
  watch: {
    articleIds () {
      this.articleSliceCount = this.articleCountPerLoad
      this.fetchArticles()
    }
  }
}
</script>
