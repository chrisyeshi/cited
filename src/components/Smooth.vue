<template>
  <v-app overflow-hidden>
    <v-navigation-drawer
      temporary fixed width=240 v-model="$store.state.isDrawerVisible">
      <v-toolbar flat>
        <v-toolbar-side-icon
          @click="$store.commit('toggle', 'isDrawerVisible')">
        </v-toolbar-side-icon>
        <v-toolbar-title class="headline ml-2"
          @click="$router.push('/smooth?layout=home')" style="cursor: pointer;">
          Discover
        </v-toolbar-title>
      </v-toolbar>
      <user-collection-list
        style="max-height: 100vh; overflow: auto;"
        @onCollectionClicked="selectUserCollection">
      </user-collection-list>
      <v-list dense style="position: absolute; bottom: 0px; width: 100%;">
        <v-divider></v-divider>
        <v-list-tile @click="selectUserCollection(-1)">
          <v-list-tile-title>History</v-list-tile-title>
        </v-list-tile>
        <v-divider></v-divider>
        <v-list-tile>
          <v-list-tile-title>Settings</v-list-tile-title>
        </v-list-tile>
        <v-divider></v-divider>
        <v-list-tile>
          <v-list-tile-title>Contact Us</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <app-collection-bar
      v-show="$store.state.isCollectionBarVisible">
    </app-collection-bar>
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
import ResponsiveTextLogo from './ResponsiveTextLogo.vue'
import UserCollectionList from './UserCollectionList.vue'
import Flipping from 'flipping/dist/flipping.web.js'
import { Graph } from './kanbangraph.js'
import api from './api.js'
import _ from 'lodash'

export default {
  name: 'Smooth',
  components: {
    AppCollectionBar,
    SearchPane,
    VisPane,
    ResponsiveTextLogo,
    UserCollectionList
  },
  props: {
    layout: String,
    searchText: String,
    refObjId: String,
    collectionId: String
  },
  methods: {
    setLayout (layoutText) {
      if (layoutText === 'home') {
        this.$store.commit('toHome')
      } else if (layoutText === 'search') {
        this.$store.commit('toSearch')
      } else if (layoutText === 'collection') {
        this.$store.commit('toCollection')
      } else if (layoutText === 'minor') {
        this.$store.commit('toMinor')
      } else if (layoutText === 'major') {
        this.$store.commit('toMajor')
      }
    },
    fetchData () {
      const query = this.$route.query
      if (query.search) {
        if (_.startsWith(query.search, 'citing:')) {
          const refObjId = query.search.substring('citing:'.length)
          // TODO: change the 'getCitedBys' to also return the current 'refObj'
          Promise.all([ api.getRefObj(refObjId), api.getCitedBys(refObjId) ])
            .then(([ refObj, refObjs ]) => {
              this.$store.commit('setState', {
                isSearched: true,
                searchText: query.search,
                searchRefObjs: refObjs,
                searchLabel: { text: 'Articles that are citing', refObj: refObj }
              })
            })
        } else if (_.startsWith(query.search, 'citedBy:')) {
          const refObjId = query.search.substring('citedBy:'.length)
          Promise.all([ api.getRefObj(refObjId), api.getReferences(refObjId) ])
            .then(([ refObj, refObjs ]) => {
              this.$store.commit('setState', {
                isSearched: true,
                searchText: query.search,
                searchRefObjs: refObjs,
                searchLabel: { text: 'References of', refObj: refObj }
              })
            })
        } else {
          api.searchRefObjs(query.search).then(refObjs => {
            this.$store.commit('setState', {
              isSearched: true,
              searchText: query.search,
              searchRefObjs: refObjs,
              searchLabel: { text: 'Search Results', refObj: { title: '' } }
            })
          })
        }
      }
      if (query.refobj) {
        api.getRefObj(query.refobj).then(refObj => {
          this.$store.commit('setState', { currRefObj: refObj })
        })
      } else {
        this.$store.commit('setState', { currRefObj: null })
      }
      if (this.$store.state.collections[query.collection]) {
        this.$store.commit('setState', {
          visPaneCollection: this.$store.state.collections[query.collection],
          graph: this.$store.state.collections[query.collection].graph
        })
      } else {
        this.$store.commit('setState', {
          visPaneCollection: 'history',
          graph: new Graph([])
        })
      }
    },
    selectUserCollection (collectionId) {
      const query = { collection: collectionId }
      query.layout =
        this.$store.getters.layout === 'home'
          ? 'collection'
          : this.$store.getters.layout === 'search'
            ? 'minor'
            : this.$store.getters.layout
      if (this.$store.state.currRefObj) {
        query.refobj = this.$store.state.currRefObj.id
      }
      this.$router.push({
        path: '/smooth',
        query: query
      })
    }
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
          flex: '0 0 315px',
          maxWidth: '315px'
        }
      } else {
        return {}
      }
    }
  },
  mounted () {
    window.flipping = new Flipping()
  },
  created () {
    this.setLayout(this.$route.query.layout)
    this.$http.get('./static/insitupdf.json')
      .then(res => {
        this.$store.commit('setState', {
          collections: [],
          visPaneCollection: 'history',
          graph: new Graph([])
        })
        this.$store.commit(
          'createUserCollection',
          {
            name: 'information visualization toolkits',
            graph: Graph.fromTestJson({
              papers: res.body.references,
              relations: res.body.relations
            })
          })
        this.$store.commit(
          'createUserCollection',
          {
            name: 'in situ visualization',
            graph: Graph.fromTestJson({
              papers: res.body.references,
              relations: res.body.relations
            })
          })
      })
      .then(() => {
        this.fetchData()
      })
  },
  watch: {
    '$route' () {
      this.setLayout(this.$route.query.layout)
      this.fetchData()
    }
  }
}
</script>

<style scoped>
</style>
