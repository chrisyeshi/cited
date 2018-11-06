<template>
  <v-layout column>
    <component :is="searchComponent" :minimal="$store.state.isVisPaneVisible">
      <search-box regular
        :flat="$store.state.isSearched"
        ref="searchBox"
        @onSearch="onSearch">
      </search-box>
    </component>
    <v-divider v-if="$store.state.isVisPaneVisible" class="my-2"></v-divider>
    <search-content
      v-if="searchComponent === 'appBar' && !$store.state.currRefObj">
      <v-layout column>
        <search-paper v-for="(refObj, index) in refObjs" :key="index"
          :refObj="refObj"
          @onClickTitle="showRefObjDetail"
          @onClickVenue="trace"
          @onClickYear="trace"
          @onClickCiting="showRelatedRefObjs('citedBy', $event)"
          @onClickCitedBy="showRelatedRefObjs('citing', $event)">
        </search-paper>
      </v-layout>
    </search-content>
    <reference-object
      v-if="$store.state.currRefObj" :refObj="$store.state.currRefObj">
    </reference-object>
  </v-layout>
</template>

<script>
import SearchPage from './SearchPage.vue'
import SearchContent from './SearchContent.vue'
import SearchBox from './SearchBox.vue'
import AppBar from './AppBar.vue'
import SearchPaper from './SearchPaper.vue'
import ReferenceObject from './ReferenceObject.vue'

export default {
  name: 'SearchPane',
  components: {
    SearchPage,
    SearchContent,
    SearchBox,
    SearchPaper,
    AppBar,
    ReferenceObject
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
          this.$store.commit('setState', { searchText: text })
          if (callback) {
            callback()
          }
        }, interval)
      })
    },
    showRefObjDetail (refObj) {
      this.$store.dispatch('setCurrRefObj', refObj.id)
    },
    showRelatedRefObjs (relation, refObj) {
      window.flipping.read()
      const query = { search: `${relation}:${refObj.id}` }
      const layout = this.$store.getters.layout
      query.layout =
        layout === 'home' || layout === 'search'
          ? 'minor'
          : layout === 'collection'
            ? 'major'
            : layout
      if (this.$store.getters.currCollectionId >= 0) {
        query.collection = this.$store.getters.currCollectionId
      }
      this.$router.push({ path: '/smooth', query: query })
      this.$nextTick(() => {
        window.flipping.flip()
      })
      if (this.$store.state.visPaneCollection === 'history') {
        this.$store.commit('insertToGraph', refObj)
      }
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
    },
    refObjs () {
      return this.$store.state.searchRefObjs
    }
  },
  mounted () {
    this.animateSearchText('visualization', 20)
  }
}
</script>

<style scoped>
</style>
