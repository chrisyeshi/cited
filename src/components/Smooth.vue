<template>
  <v-app overflow-hidden>
    <v-navigation-drawer
      v-show="$store.state.openSideDrawer"
      clipped
      fixed
      right
      app
    >
      <v-list dense>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>settings</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Account Settings</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>history</v-icon>
          </v-list-tile-action>
          <v-list-tile-title>History</v-list-tile-title>
        </v-list-tile>
        <v-list-group
          prepend-icon="list"
          value="true"
        >
          <v-list-tile slot="activator">
            <v-list-tile-title>My Collections</v-list-tile-title>
          </v-list-tile>
          <user-collection-list dense></user-collection-list>
        </v-list-group>
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
import UserCollectionList from './UserCollectionList.vue'
import SearchPane from './SearchPane.vue'
import VisPane from './VisPane.vue'
import Flipping from 'flipping/dist/flipping.web.js'
import { Graph } from './kanbangraph.js'

export default {
  name: 'Smooth',
  components: {
    AppCollectionBar,
    UserCollectionList,
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
  beforeCreate () {
    this.$http.get('./static/insitupdf.json').then(res => {
      this.$store.commit('setTestGraph', Graph.fromTestJson({
        papers: res.body.references,
        relations: res.body.relations
      }))
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
  }
}
</script>

<style scoped>
</style>
