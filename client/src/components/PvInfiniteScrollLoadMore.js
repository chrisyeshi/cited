import Vue from 'vue'
import createWithOnScroll from './PvWithOnScroll.js'

export default function (scrollTarget) {
  const WithOnScroll = createWithOnScroll(scrollTarget)
  return Vue.component('pv-infinite-scroll-load-more', {
    components: { 'on-scroll': WithOnScroll },
    template: `
      <on-scroll :style="styleObject"
        :bottomOffset="bottomOffset" @scroll-at-bottom="onScrollAtBottom">
        <v-btn v-if="!isDone && !isEmpty && !isLoadingMore" depressed
          @click="onLoadMore">
          LOAD MORE
        </v-btn>
        <v-progress-circular v-if="isLoadingMore" indeterminate>
        </v-progress-circular>
        <div v-if="isDone">All Results Loaded</div>
        <div v-if="isEmpty">Empty Results</div>
      </on-scroll>
    `,
    props: {
      bottomOffset: {
        type: Number,
        default: 0
      },
      height: {
        type: Number,
        default: 64
      },
      isDone: false,
      isEmpty: false,
      isLoadingMore: false
    },
    computed: {
      styleObject () {
        return {
          height: this.height ? this.height + 'px' : undefined,
          display: 'flex',
          'align-items': 'center'
        }
      }
    },
    methods: {
      onLoadMore () {
        this.$emit('load-more')
      },
      onScrollAtBottom () {
        if (!this.isDone) {
          this.onLoadMore()
        }
      }
    }
  })
}
