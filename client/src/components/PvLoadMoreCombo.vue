<template>
  <div :style="styleObject">
    <v-btn v-if="!isDone && !isEmpty && !isLoadingMore" depressed
      @click="$emit('loadMore')">
      LOAD MORE
    </v-btn>
    <v-progress-circular v-if="isLoadingMore" indeterminate>
    </v-progress-circular>
    <div v-if="isDone">All Results Loaded</div>
    <div v-if="isEmpty">Empty Results</div>
  </div>
</template>

<script>
export default {
  name: 'PvLoadMoreCombo',
  props: {
    height: {
      type: Number,
      default: 64
    },
    isDone: Boolean,
    isEmpty: Boolean,
    isLoadingMore: Boolean
  },
  computed: {
    styleObject () {
      return {
        height: this.height ? this.height + 'px' : undefined,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center'
      }
    }
  }
}
</script>
