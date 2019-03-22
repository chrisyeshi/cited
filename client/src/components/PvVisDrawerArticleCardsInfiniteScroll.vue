<template>
  <v-flex-with-scroll :bottom-offset="bottomOffset"
    @scroll-at-bottom="onLoadMore">
    <v-flex v-for="article in currArticles" :key="article.id" shrink
      class="caption">
      <pv-vis-card :article="article" :config="cardConfig" :style="cardStyle"
        :referenceColor="getCardReferenceColor(article.id)"
        :citedByColor="getCardCitedByColor(article.id)"
        @click.native="$emit('click-card', article.id)"
        @mouseenter.native.stop="onCardMouseEnter(article.id)"
        @mouseleave.native.stop="onCardMouseLeave(article.id)">
      </pv-vis-card>
    </v-flex>
    <pv-load-more-combo v-bind="loadStatus" :height="bottomOffset"
      @load-more="onLoadMore">
    </pv-load-more-combo>
  </v-flex-with-scroll>
</template>

<script>
import _ from 'lodash'
import PvLoadMoreCombo from './PvLoadMoreCombo.vue'
import PvVisCard from './PvVisCard.vue'
import theArticlePool from './pvarticlepool.js'
import withScroll from './withscroll.js'

const VFlexWithScroll = withScroll('v-flex')

export default {
  name: 'PvVisDrawerArticleCardsInfiniteScroll',
  components: { PvLoadMoreCombo, PvVisCard, VFlexWithScroll },
  props: {
    articleIds: Array,
    articleCountPerLoad: {
      type: Number,
      default: 5
    },
    cardConfig: Object,
    getCardCitedByColor: Function,
    getCardReferenceColor: Function,
    hoveringArticleId: String
  },
  data () {
    this.currArticlesPromise = null
    return {
      articleSliceCount: this.articleCountPerLoad,
      bottomOffset: 64,
      currArticles: [],
      internalHoveringArticleId: null,
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
      const currArticlesPromise =
        Promise.all(
          _.map(this.currArtIds, artId => theArticlePool.getMeta(artId)))
      this.currArticlesPromise = currArticlesPromise
      const currArticles = await currArticlesPromise
      if (currArticlesPromise !== this.currArticlesPromise) {
        // if another async operation has started
        return
      }
      this.currArticles = currArticles
      this.loadStatus = {
        isDone: this.articleIds.length !== 0 &&
          this.articleIds.length === this.currArticles.length,
        isEmpty: this.articleIds.length === 0,
        isLoadingMore: false
      }
    },
    onCardMouseEnter (articleId) {
      this.internalHoveringArticleId = articleId
    },
    onCardMouseLeave () {
      this.internalHoveringArticleId = null
    },
    onLoadMore () {
      this.articleSliceCount += this.articleCountPerLoad
      this.fetchArticles()
    }
  },
  watch: {
    articleIds (curr) {
      this.articleSliceCount = this.articleCountPerLoad
      this.currArticles = []
      this.loadStatus = {
        isDone: false,
        isEmpty: false,
        isLoadingMore: false
      }
      this.fetchArticles()
    },
    internalHoveringArticleId (curr) {
      this.$emit('update:hoveringArticleId', curr)
    }
  }
}
</script>
