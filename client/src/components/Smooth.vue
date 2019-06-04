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
          @click="$router.push('/alpha')" style="cursor: pointer;">
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
          @onSelectUserCollection="selectUserCollection"
          @addToCurrColl="addToCurrColl">
        </component>
        <v-flex id="vis-flex"
          v-show="isVisPaneVisible" :style="visPaneStyle">
          <vis-pane :size="visPaneSize" @onToggleSize="toggleVisPaneSize">
          </vis-pane>
        </v-flex>
      </v-layout>
    </v-content>
    <div v-show="isTour" id="popper"
      class="theme--dark popper" style="z-index: 1000;">
      <v-card dark max-width='400px'>
        <v-card-title>
          {{ currTourStepText }}
        </v-card-title>
        <v-card-actions>
          <v-btn v-if="this.$store.state.currTourStep !== 0" small flat
            @click="prevTourStep">
            Previous
          </v-btn>
          <v-btn small flat @click="nextTourStep">
            {{ this.$store.state.currTourStep === 6 ? 'Real-World Example' : 'Next' }}
          </v-btn>
        </v-card-actions>
      </v-card>
      <span class="popper__arrow"></span>
    </div>
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
import Popper from 'popper.js'
import api from './api.js'
import _ from 'lodash'

let popper = null

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
    isTour: Boolean,
    currTourStep: Number,
    routeSearchText: String,
    refObjId: String,
    collId: String
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
        return [ text, { text: 'Search Results', refObj: { title: '' } }, [] ]
      }
      if (_.startsWith(text, 'citing:')) {
        const refObjId = text.substring('citing:'.length)
        const { refObj, citedBys } = await api.getCitedBys(refObjId)
        return [
          text,
          { text: 'Articles that are citing', refObj: refObj },
          citedBys
        ]
      }
      if (_.startsWith(text, 'citedBy:')) {
        const refObjId = text.substring('citedBy:'.length)
        const { refObj, references } = await api.getReferences(refObjId)
        return [ text, { text: 'References of', refObj }, references ]
      }
      if (_.startsWith(text, 'common:')) {
        const refObjIdStr = text.substring('common:'.length)
        const refObjIds = _.split(refObjIdStr, '&')
        const { refObjs, relatives } = await api.getCommonRelatives(refObjIds)
        return [
          text,
          { text: 'Common relatives of', refObj: refObjs },
          relatives
        ]
      }
      const refObjs = await api.searchRefObjs(text)
      return [ text, { text: 'Search Results', refObj: { title: '' } }, refObjs ]
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
        this.fetchSearch(this.routeSearchText),
        this.fetchRefObj(this.refObjId),
        this.fetchCollection(this.collId)
      ]).then(([ [ text, label, refObjs ], refObj, [ coll, graph ] ]) => {
        this.$store.commit('setState', {
          isTour: false,
          showAllRelations: false,
          searchText: text,
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
        this.$router.push(`/alpha/collection/${collId}`)
      } else if (!_.isNil(this.searchText)) {
        this.$router.push(
          `/alpha/search/${this.searchText}/collection/${collId}`)
      } else if (this.searchComponent === 'referenceObject') {
        this.$router.push(
          `/alpha/refobj/${this.refObjId}/collection/${collId}`)
      } else {
        this.$router.push(`/alpha/collection/${collId}`)
      }
    },
    toggleVisPaneSize () {
      const prevLayout = this.layout
      if (prevLayout === 'vis') {
        this.layout = 'visMajor'
      } else if (prevLayout === 'visMajor') {
        this.layout = 'searchMajor'
      } else {
        this.layout = 'vis'
      }
      const currLayout = this.layout
      this.$ga.event('layout', 'toggle to', currLayout)
    },
    toHome () {
      window.flipping.read()
      this.$router.push('/alpha')
      this.$nextTick(() => {
        window.flipping.flip()
      })
    },
    async addToCurrColl (refObj) {
      await this.$store.dispatch('pushToHistory', refObj.id)
      this.layout = this.nextLayout
    },
    prevTourStep () {
      this.$router.push(`/tour/${this.$store.state.currTourStep - 1}`)
    },
    nextTourStep () {
      this.$router.push(`/tour/${this.$store.state.currTourStep + 1}`)
    },
    updatePopper () {
      if (this.isTour) {
        if (!popper) {
          const referenceEl = document.querySelector(this.$store.state.tourReferenceSelector)
          const popperEl = document.querySelector('#popper')
          popper = new Popper(referenceEl, popperEl, {
            placement: this.$store.state.popperPlacement,
            modifiers: {
              preventOverflow: { enabled: true, boundariesElement: window },
              hide: { enabled: false }
            }
          })
        } else {
          popper.reference =
              document.querySelector(this.$store.state.tourReferenceSelector)
          popper.options.placement = this.$store.state.popperPlacement
          popper.update()
        }
      } else {
        if (popper) {
          popper.destroy()
          popper = null
        }
      }
    }
  },
  computed: {
    isTourDialogVisible () {
      return true
    },
    isAppBarSearchBoxVisible () {
      return !_.isNil(this.searchText) || !_.isNil(this.refObjId) || !_.isNil(this.collId)
    },
    searchText () {
      return this.routeSearchText || this.$store.state.searchText
    },
    searchComponent () {
      return _.isNil(this.searchText) && _.isNil(this.refObjId) && _.isNil(this.collId)
        ? 'searchPage'
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
    layout: {
      get () {
        return this.$store.state.layout
      },
      set (value) {
        this.$store.commit('setState', { layout: value })
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
        } else if (currLayout === 'visMajor') {
          return 'visMajor'
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
    },
    currTourStepText () {
      return this.$store.state.tourText
    }
  },
  mounted () {
    window.flipping = new Flipping()
    this.updatePopper()
  },
  updated () {
    this.updatePopper()
  },
  async created () {
    const signedIn = this.$store.dispatch('isServerSignedIn')
    if (this.isTour) {
      this.$store.dispatch('toTourStep', this.currTourStep)
    } else {
      signedIn.then(() => {
        this.layout = this.nextLayout
        this.fetchData()
      })
    }
  },
  watch: {
    '$route' () {
      if (this.isTour) {
        this.$store.dispatch('toTourStep', this.currTourStep)
        return
      }
      this.layout = this.nextLayout
      this.fetchData()
    }
  }
}
</script>

<style scoped>
.popper .popper__arrow {
  width: 0;
  height: 0;
  border-style: solid;
  position: absolute;
  margin: 5px;
}

.popper[x-placement^="top"],
.tooltip[x-placement^="top"] {
    margin-bottom: 10px;
}
.popper[x-placement^="top"] .popper__arrow,
.tooltip[x-placement^="top"] .tooltip-arrow {
    border-width: 5px 5px 0 5px;
    border-left-color: transparent;
    border-right-color: transparent;
    border-bottom-color: transparent;
    bottom: -5px;
    left: calc(50% - 5px);
    margin-top: 0;
    margin-bottom: 0;
}
.popper[x-placement^="bottom"],
.tooltip[x-placement^="bottom"] {
    margin-top: 10px;
}
.tooltip[x-placement^="bottom"] .tooltip-arrow,
.popper[x-placement^="bottom"] .popper__arrow {
    border-width: 0 5px 5px 5px;
    border-left-color: transparent;
    border-right-color: transparent;
    border-top-color: transparent;
    top: -5px;
    left: calc(50% - 5px);
    margin-top: 0;
    margin-bottom: 0;
}
.tooltip[x-placement^="right"],
.popper[x-placement^="right"] {
    margin-left: 10px;
}
.popper[x-placement^="right"] .popper__arrow,
.tooltip[x-placement^="right"] .tooltip-arrow {
    border-width: 5px 5px 5px 0;
    border-left-color: transparent;
    border-top-color: transparent;
    border-bottom-color: transparent;
    left: -5px;
    top: calc(50% - 5px);
    margin-left: 0;
    margin-right: 0;
}
.popper[x-placement^="left"],
.tooltip[x-placement^="left"] {
    margin-right: 10px;
}
.popper[x-placement^="left"] .popper__arrow,
.tooltip[x-placement^="left"] .tooltip-arrow {
    border-width: 5px 0 5px 5px;
    border-top-color: transparent;
    border-right-color: transparent;
    border-bottom-color: transparent;
    right: -5px;
    top: calc(50% - 5px);
    margin-left: 0;
    margin-right: 0;
}
</style>
