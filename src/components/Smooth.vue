<template>
  <v-app overflow-hidden>
    <app-collection-bar fixed
      v-show="$store.state.isCollectionBarVisible">
    </app-collection-bar>
    <v-toolbar flat v-show="$store.state.isCollectionBarVisible"></v-toolbar>
    <v-layout row overflow-hidden>
      <search-pane class="overflow-hidden"
        v-show="$store.state.isSearchPaneVisible && $store.state.visPaneState !== 'full'"
        :style="searchPaneStyle">
      </search-pane>
      <v-flex
        v-show="$store.state.isVisPaneVisible" :style="visPaneStyle">
        <vis-pane></vis-pane>
      </v-flex>
    </v-layout>
  </v-app>
</template>

<script>
import AppCollectionBar from './AppCollectionBar.vue'
import SearchPane from './SearchPane.vue'
import VisPane from './VisPane.vue'
import Flipping from 'flipping/dist/flipping.web.js'

export default {
  name: 'Smooth',
  components: {
    AppCollectionBar,
    SearchPane,
    VisPane
  },
  computed: {
    searchPaneStyle () {
      if (!this.$store.state.isVisPaneVisible) {
        return {}
      }
      if (this.$store.state.visPaneState === 'minor') {
        return {}
      }
      if (this.$store.state.visPaneState === 'major') {
        return {
          flex: '0 0 450px',
          maxWidth: '450px'
        }
      }
      if (this.$store.state.visPaneState === 'full') {
        return {}
      }
    },
    visPaneStyle () {
      if (this.$store.state.visPaneState === 'minor') {
        return {
          flex: '0 0 310px',
          maxWidth: '310px'
        }
      } else {
        return {}
      }
    }
  },
  mounted () {
    window.flipping = new Flipping()
  }
}
</script>

<style scoped>
</style>
