<template>
  <v-layout column>
    <component :is="searchComponent" :minimal="$store.state.isVisPaneVisible">
      <search-box regular
        :flat="$store.state.isSearched"
        ref="searchBox"
        @onSearch="onSearch">
      </search-box>
    </component>
    <search-content v-if="searchComponent === 'appBar'">
      <v-layout column style="height: calc(100vh - 155px); overflow: auto;">
        <search-paper v-for="(refObj, index) in refObjs" :key="index"
          @onClickTitle="showRefObjDetail"
          @onClickCiting="showRelatedRefObjs('citing', $event)"
          @onClickCitedBy="showRelatedRefObjs('citedBy', $event)">
        </search-paper>
      </v-layout>
    </search-content>
  </v-layout>
</template>

<script>
import SearchPage from './SearchPage.vue'
import SearchContent from './SearchContent.vue'
import SearchBox from './SearchBox.vue'
import AppBar from './AppBar.vue'
import SearchPaper from './SearchPaper.vue'

export default {
  name: 'SearchPane',
  components: {
    SearchPage,
    SearchContent,
    SearchBox,
    SearchPaper,
    AppBar
  },
  data () {
    return {
      refObjs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    },
    animateSearchText (text, interval, callback) {
      if (text === '') {
        callback()
        return
      }
      this.animateSearchText(text.slice(0, text.length - 1), interval, () => {
        setTimeout(() => {
          this.$store.commit('setSearchText', text)
          if (callback) {
            callback()
          }
        }, interval)
      })
    },
    showRefObjDetail () {
      this.trace()
    },
    showRelatedRefObjs () {
      if (!this.$store.state.isVisPaneVisible) {
        window.flipping.read()
        this.$store.dispatch('toSearchCollection')
        this.$nextTick(() => {
          window.flipping.flip()
        })
      }
      this.$store.commit('pushCard', null)
    },
    onSearch (text) {
      window.flipping.read()
      this.$store.dispatch('search', text)
      this.$nextTick(() => {
        window.flipping.flip()
      })
    }
  },
  computed: {
    searchComponent () {
      if (this.$store.state.isSearched) {
        return 'appBar'
      }
      return 'searchPage'
    }
  },
  mounted () {
    this.animateSearchText('visualization', 20)
  }
}
</script>

<style scoped>
</style>
