import Vue from 'vue'

export default function (scrollTarget) {
  return Vue.component('pv-infinite-scroll-load-more', {
    template: `
      <div v-scroll:${scrollTarget}="onScroll">
        <v-btn v-if="!isDone && !isEmpty && !isLoadingMore" depressed
          @click="onLoadMore">
          LOAD MORE
        </v-btn>
        <v-progress-circular v-if="isLoadingMore" indeterminate>
        </v-progress-circular>
        <div v-if="isDone">All Results Loaded</div>
        <div v-if="isEmpty">Empty Results</div>
      </div>
    `,
    props: {
      isDone: false,
      isEmpty: false,
      isLoadingMore: false
    },
    methods: {
      onLoadMore () {
        this.$emit('load-more')
      },
      onScroll ({ target }) {
        const isAtBottom =
          target.scrollHeight - target.scrollTop === target.offsetHeight
        if (isAtBottom && !this.isDone) {
          this.onLoadMore()
        }
      }
    }
  })
}
