<template>
  <v-layout column>
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
import showRelatedRefObjs from './showrelatedrefobjs.js'

export default {
  name: 'SearchPane',
  mixins: [
    showRelatedRefObjs
  ],
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
    showRefObjDetail (refObj) {
      this.$store.dispatch('setCurrRefObj', refObj.id)
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
  }
}
</script>

<style scoped>
</style>
