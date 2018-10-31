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
          @onClickCiting="showRelatedRefObjs('citing', $event)"
          @onClickCitedBy="showRelatedRefObjs('citedBy', $event)">
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
          this.$store.commit('setSearchText', text)
          if (callback) {
            callback()
          }
        }, interval)
      })
    },
    showRefObjDetail (refObj) {
      this.$store.commit('set', { prop: 'currRefObj', value: refObj })
    },
    showRelatedRefObjs (relation, refObj) {
      if (!this.$store.state.isVisPaneVisible) {
        window.flipping.read()
        this.$store.commit('toSearchCollection')
        this.$nextTick(() => {
          window.flipping.flip()
        })
      }
      this.$store.dispatch(
        'showRelatedTestRefObjs', { relation: relation, refObj: refObj })
      this.$store.commit('insertToGraph', refObj)
    },
    onSearch (text) {
      window.flipping.read()
      this.$store.commit('search', text)
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
