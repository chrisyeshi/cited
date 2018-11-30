<template>
  <v-app overflow-hidden>
    <v-navigation-drawer
      app :temporary="$store.state.enableDrawerTemporary" clipped width=240
      v-model="$store.state.isDrawerVisible">
      <v-toolbar v-if="$store.state.enableDrawerTemporary" flat>
        <v-toolbar-side-icon
          @click="$store.commit('toggle', 'isDrawerVisible')">
        </v-toolbar-side-icon>
        <v-toolbar-title class="headline ml-2"
          @click="$router.push('/smooth')" style="cursor: pointer;">
          Discover
        </v-toolbar-title>
      </v-toolbar>
      <user-collection-list
        style="max-height: 100vh; overflow: auto; margin-top: 12px;"
        @onCollectionClicked="selectUserCollection">
      </user-collection-list>
      <v-list dense style="position: absolute; bottom: 0px; width: 100%;">
        <v-divider></v-divider>
        <v-list-tile @click="selectUserCollection(-1)">
          <v-list-tile-title>History</v-list-tile-title>
        </v-list-tile>
        <v-divider></v-divider>
        <v-list-tile @click="trace">
          <v-list-tile-title>Settings</v-list-tile-title>
        </v-list-tile>
        <v-divider></v-divider>
        <v-list-tile @click="trace">
          <v-list-tile-title>Contact Us</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <app-bar :showSearchBox="isAppBarSearchBoxVisible" @toHome="toHome">
      <search-box flat ref="searchBox" @onSearch="onSearch"></search-box>
    </app-bar>
    <v-content>
      <v-layout row overflow-hidden>
        <component :is="searchComponent" overflow-hidden v-bind="searchProps"
          v-show="isSearchPaneVisible" :style="searchPaneStyle"
          @onSelectUserCollection="selectUserCollection">
        </component>
        <v-flex
          v-show="isVisPaneVisible" :style="visPaneStyle">
          <vis-pane :size="visPaneSize" @onToggleSize="toggleVisPaneSize">
          </vis-pane>
        </v-flex>
      </v-layout>
    </v-content>
  </v-app>
</template>

<script>
import AppBar from './AppBar.vue'
import SearchBox from './SearchBox.vue'
import SearchPage from './SearchPage.vue'
import SearchPane from './SearchPane.vue'
import ReferenceObject from './ReferenceObject.vue'
import VisPane from './VisPane.vue'
import ResponsiveTextLogo from './ResponsiveTextLogo.vue'
import UserCollectionList from './UserCollectionList.vue'
import Flipping from 'flipping/dist/flipping.web.js'
import api from './api.js'
import _ from 'lodash'

export default {
  name: 'Smooth',
  components: {
    AppBar,
    SearchBox,
    SearchPage,
    SearchPane,
    ReferenceObject,
    VisPane,
    ResponsiveTextLogo,
    UserCollectionList
  },
  props: {
    searchText: String,
    refObjId: String,
    collId: String
  },
  data () {
    return {
      layout: 'vis'
    }
  },
  methods: {
    trace (value) {
      console.log(value)
      return value
    },
    onSearch (text) {
      window.flipping.read()
      this.$store.dispatch('search', text)
      this.$nextTick(() => {
        window.flipping.flip()
      })
    },
    async fetchSearch (text) {
      if (_.isNil(text)) {
        return [ { text: '', refObj: { title: '' } }, [] ]
      }
      if (_.startsWith(text, 'citing:')) {
        const refObjId = text.substring('citing:'.length)
        const { refObj, citedBys } = await api.getCitedBys(refObjId)
        return [
          { text: 'Articles that are citing', refObj: refObj },
          citedBys
        ]
      }
      if (_.startsWith(text, 'citedBy:')) {
        const refObjId = text.substring('citedBy:'.length)
        const { refObj, references } = await api.getReferences(refObjId)
        return [ { text: 'References of', refObj }, references ]
      }
      const refObjs = await api.searchRefObjs(text)
      return [ { text: 'Search Results', refObj: { title: '' } }, refObjs ]
    },
    async fetchRefObj (refObjId) {
      if (_.isNil(refObjId)) {
        return {
          title: '',
          abstract: '',
          authors: [],
          venue: { title: '' },
          referenceCount: 0,
          references: [],
          citedByCount: 0
        }
      }
      return api.getRefObj(refObjId)
    },
    async fetchCollection (collId) {
      if (_.isNil(collId)) {
        return [ 'history', this.$store.state.historyGraph ]
      }
      const coll =
        _.find(this.$store.getters.myCollections, coll => coll.id === collId)
      return [ coll, coll.graph ]
    },
    fetchData () {
      Promise.all([
        this.fetchSearch(this.searchText),
        this.fetchRefObj(this.refObjId),
        this.fetchCollection(this.collId)
      ]).then(([ [ label, refObjs ], refObj, [ coll, graph ] ]) => {
        this.$store.commit('setState', {
          searchText: this.searchText,
          searchLabel: label,
          searchRefObjs: refObjs,
          currRefObj: refObj,
          visPaneCollection: coll,
          graph: graph
        })
      })
    },
    selectUserCollection (collId) {
      if (this.searchComponent === 'searchPage') {
        this.$router.push(`/smooth/collection/${collId}`)
      } else if (this.searchComponent === 'searchPane') {
        this.$router.push(
          `/smooth/search/${this.searchText}/collection/${collId}`)
      } else if (this.searchComponent === 'referenceObject') {
        this.$router.push(`/smooth/refobj/${this.refObjId}/collection/${collId}`)
      } else {
        this.$router.push(`/smooth/collection/${collId}`)
      }
    },
    toggleVisPaneSize () {
      if (this.layout === 'vis') {
        this.layout = 'visMajor'
      } else if (this.layout === 'visMajor') {
        this.layout = 'searchMajor'
      } else {
        this.layout = 'vis'
      }
    },
    toHome () {
      window.flipping.read()
      this.$router.push('/smooth')
      this.$nextTick(() => {
        window.flipping.flip()
      })
    }
  },
  computed: {
    isAppBarSearchBoxVisible () {
      return !_.isNil(this.searchText) || !_.isNil(this.refObjId) || !_.isNil(this.collId)
    },
    searchComponent () {
      return _.isNil(this.searchText) && _.isNil(this.refObjId) && _.isNil(this.collId)
        ? 'searchPage'
        : !_.isNil(this.collId)
          ? 'searchPane'
          : !_.isNil(this.searchText)
            ? 'searchPane'
            : 'referenceObject'
    },
    searchProps () {
      if (this.searchComponent === 'searchPane') {
        if (this.layout === 'searchMajor' || this.layout === 'visMajor') {
          return { showFilter: false }
        } else {
          return { showFilter: true }
        }
      }
      if (this.searchComponent === 'referenceObject') {
        if (this.layout === 'searchMajor' || this.layout === 'visMajor') {
          return { fluid: false }
        } else {
          return { fluid: true }
        }
      }
      return {}
    },
    isSearchPaneVisible () {
      return this.layout !== 'vis'
    },
    searchPaneStyle () {
      if (this.layout === 'visMajor') {
        return {
          flex: '0 0 450px',
          maxWidth: '450px'
        }
      }
      return {}
    },
    isVisPaneVisible () {
      return this.layout !== 'search'
    },
    visPaneStyle () {
      if (this.layout === 'searchMajor') {
        return {
          flex: '0 0 315px',
          maxWidth: '315px'
        }
      }
      return {}
    },
    visPaneSize () {
      if (this.layout === 'vis') {
        return 'full'
      } else if (this.layout === 'searchMajor') {
        return 'minor'
      } else {
        return 'major'
      }
    },
    routeLayout () {
      if (_.isNil(this.collId)) {
        return 'search'
      } else if (_.isNil(this.searchText) && _.isNil(this.refObjId)) {
        return 'vis'
      } else {
        return 'split'
      }
    },
    nextLayout () {
      const currLayout = this.layout
      if (this.routeLayout === 'search') {
        if (this.isHistoryEmpty || this.searchComponent === 'searchPage') {
          return 'search'
        } else {
          return 'searchMajor'
        }
      } else if (this.routeLayout === 'vis') {
        return 'vis'
      } else { // 'split'
        if (currLayout === 'search') {
          return 'searchMajor'
        } else if (currLayout === 'vis') {
          return 'visMajor'
        } else {
          return currLayout
        }
      }
    },
    isHistoryEmpty () {
      return this.$store.state.historyGraph.nodes.length === 0
    }
  },
  mounted () {
    window.flipping = new Flipping()
  },
  async created () {
    await this.$store.dispatch('isServerSignedIn')
    this.layout = this.nextLayout
    await this.fetchData()
  },
  watch: {
    '$route' () {
      this.layout = this.nextLayout
      this.fetchData()
    }
  }
}
</script>

<style scoped>
</style>
