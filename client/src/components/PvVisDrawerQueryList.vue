<template>
  <v-container-with-scroll v-bind="$attrs" :bottom-offset="bottomOffset"
    @scroll-at-bottom="onLoadMore">
    <v-layout column>
      <v-flex v-if="loadStatus.isTotalCountVisible" shrink
        class="mb-3 caption grey--text text--darken-1">
        Found {{ pageQuery.getTotalArticleCount() }} articles from arXiv
      </v-flex>
      <v-flex v-for="article in articles" :key="article.id"
        @mouseenter.stop="onItemMouseEnter(article.id)"
        @mouseleave.stop="onItemMouseLeave(article.id)">
        <div class="caption font-weight-bold">
          {{ article.data.authors[0].surname }} {{ article.data.year }}
        </div>
        <a class="body-1" v-line-clamp="2"
          @click="$emit('click-item-title', article.id)">
          {{ article.data.title }}
        </a>
        <div v-if="isListItemStatsVisible(article)"
          class="caption text-truncate" style="display: flex;">
          <span class="text-truncate" style="margin-right: auto;">
            {{ article.data.venue ? article.data.venue.name : '' }}
          </span>
          <span class="mx-3">References {{ article.nReferences }}</span>
          <span class="ml-3">Cited by {{ article.nCitedBys }}</span>
        </div>
        <v-divider class="my-2"></v-divider>
      </v-flex>
      <pv-load-more-combo v-bind="loadStatus" :height="bottomOffset"
        @load-more="onLoadMore">
      </pv-load-more-combo>
    </v-layout>
  </v-container-with-scroll>
</template>

<script>
import _ from 'lodash'
import PvLoadMoreCombo from './PvLoadMoreCombo.vue'
import theArticlePool from './pvarticlepool.js'
import withScroll from './withscroll.js'

const VContainerWithScroll = withScroll('v-container')

export default {
  name: 'PvVisDrawerQueryList',
  components: { PvLoadMoreCombo, VContainerWithScroll },
  props: {
    hoveringArticleId: String,
    pageQuery: Object
  },
  data () {
    return {
      articles: [],
      bottomOffset: 64,
      internalHoveringArticleId: null,
      loadStatus: {
        isDone: false,
        isEmpty: false,
        isLoadingMore: false,
        isTotalCountVisible: false
      }
    }
  },
  methods: {
    isListItemStatsVisible (article) {
      const isVenue = article.data.venue ? article.data.venue.name : false
      return isVenue ||
        !_.isNil(article.nReferences) ||
        !_.isNil(article.nCitedBys)
    },
    onItemMouseEnter (artId) {
      this.internalHoveringArticleId = artId
    },
    onItemMouseLeave () {
      this.internalHoveringArticleId = null
    },
    async onLoadMore () {
      this.loadStatus = {
        ...this.loadStatus,
        isLoadingMore: true,
        isTotalCountVisible: true
      }
      const currArtIds = _.map(this.articles, art => art.id)
      const nextArtIds = [ ...currArtIds, ...await this.pageQuery.next() ]
      this.articles =
        await Promise.all(
          _.map(nextArtIds, artId => theArticlePool.getMeta(artId)))
      this.loadStatus = {
        isDone: this.pageQuery.isDone(),
        isEmpty: this.pageQuery.isEmpty(),
        isLoadingMore: false,
        isTotalCountVisible: true
      }
    }
  },
  watch: {
    internalHoveringArticleId (curr) {
      this.$emit('update:hoveringArticleId', curr)
    },
    pageQuery: {
      immediate: true,
      async handler (curr) {
        if (curr) {
          this.articles = []
          this.loadStatus = {
            isDone: false,
            isEmpty: false,
            isLoadingMore: true,
            isTotalCountVisible: false
          }
          const artIds = await curr.start()
          this.articles =
            await Promise.all(
              _.map(artIds, artId => theArticlePool.getMeta(artId)))
          this.loadStatus = {
            isDone: this.pageQuery.isDone(),
            isEmpty: this.pageQuery.isEmpty(),
            isLoadingMore: false,
            isTotalCountVisible: true
          }
        }
      }
    }
  }
}
</script>
