import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'
import { Graph } from './components/kanbangraph.js'
import { Paper } from './components/paper.js'
import router from './router/index.js'
import api from './components/api.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    isSignedIn: false,
    isSearchPaneVisible: true,
    isVisPaneVisible: false,
    visPaneState: 'minor',
    searchPaneState: 'search',
    isSearched: false,
    searchText: '',
    searchLabel: { text: '', refObj: { title: '' } },
    collectionTitle: '',
    // TODO: graph duplicates with visPaneCollection and historyCollection
    graph: new Graph([]),
    hoveredGraphNode: null,
    searchRefObjs: [],
    collections: [],
    visPaneCollection: 'history',
    historyGraph: new Graph([]),
    currRefObj: new Paper(),
    visPaneLOD: 'full',
    isDrawerVisible: false,
    enableUserCollectionDropdown: false,
    enableDrawer: true,
    enableDrawerTemporary: false
  },
  actions: {
    toggleVisPaneState (context) {
      if (context.state.visPaneState === 'minor') {
        context.commit('setState', { visPaneState: 'major' })
      } else if (context.state.visPaneState === 'major') {
        context.commit('setState', { visPaneState: 'full' })
      } else if (context.state.visPaneState === 'full') {
        context.commit('setState', { visPaneState: 'minor' })
      }
    },
    async showCommonRelatives (context, refObjs) {
      const relatives =
        await api.getCommonRelatives(_.map(refObjs, ({ id }) => id))
      const label = { text: 'Common relatives of', refObj: refObjs }
      context.commit('setSearchResults', { label: label, refObjs: relatives })
    },
    async search (context, text) {
      if (_.isEmpty(text)) {
        return
      }
      const query = { search: text }
      const currLayout = context.getters.layout
      query.layout =
        currLayout === 'home' || currLayout === 'refobj'
          ? 'search'
          : currLayout === 'collection'
            ? 'majorsearch'
            : currLayout
      if (context.getters.currCollectionId >= 0) {
        query.collection = context.getters.currCollectionId
      }
      router.push({ path: '/smooth', query: query })
    },
    async showRefObjDetail (context, refObjId) {
      const query = { refobj: refObjId }
      const currLayout = context.getters.layout
      query.layout =
        currLayout === 'home' || currLayout === 'search'
          ? 'refobj'
          : currLayout === 'collection' || currLayout === 'majorsearch'
            ? 'majorrefobj'
            : currLayout === 'minorsearch'
              ? 'minorrefobj'
              : currLayout
      if (context.getters.currCollectionId >= 0) {
        query.collection = context.getters.currCollectionId
      }
      router.push({ path: '/smooth', query: query })
    }
  },
  mutations: {
    set (state, { prop, value }) {
      state[prop] = value
    },
    setState (state, newState) {
      Object.assign(state, { ...state, ...newState })
    },
    toggle (state, prop) {
      state[prop] = !state[prop]
    },
    toHome (state) {
      state.isSearchPaneVisible = true
      state.isVisPaneVisible = false
      state.visPaneState = 'minor'
      state.isSearched = false
      state.graph = new Graph([])
      state.visPaneCollection = 'history'
    },
    toSearch (state) {
      state.isSearchPaneVisible = true
      state.isSearched = true
      state.isVisPaneVisible = false
      state.searchPaneState = 'search'
      console.log(state.searchPaneState)
    },
    toRefObj (state) {
      state.isSearchPaneVisible = true
      state.isSearched = true
      state.isVisPaneVisible = false
      state.searchPaneState = 'refobj'
    },
    toCollection (state) {
      state.isSearchPaneVisible = true
      state.isSearched = true
      state.isVisPaneVisible = true
      state.visPaneState = 'full'
    },
    toMinorSearch (state) {
      state.isSearchPaneVisible = true
      state.isSearched = true
      state.isVisPaneVisible = true
      state.visPaneState = 'minor'
      state.searchPaneState = 'search'
    },
    toMinorRefObj (state) {
      state.isSearchPaneVisible = true
      state.isSearched = true
      state.isVisPaneVisible = true
      state.visPaneState = 'minor'
      state.searchPaneState = 'refobj'
    },
    toMajorSearch (state) {
      state.isSearchPaneVisible = true
      state.isSearched = true
      state.isVisPaneVisible = true
      state.visPaneState = 'major'
      state.searchPaneState = 'search'
    },
    toMajorRefObj (state) {
      state.isSearchPaneVisible = true
      state.isSearched = true
      state.isVisPaneVisible = true
      state.visPaneState = 'major'
      state.searchPaneState = 'refobj'
    },
    toggleIsSignedIn (state) {
      state.isSignedIn = !state.isSignedIn
    },
    toggleNodeSelected (state, node) {
      state.graph.toggleSelected(node)
    },
    clearSelectedNodes (state) {
      state.graph.deselectAllNodes()
    },
    insertToGraph (state, refObj) {
      try {
        state.graph.insert(refObj)
      } catch (error) {
      }
    },
    insertToHistory (state, refObj) {
      try {
        state.historyGraph.insert(refObj)
      } catch (error) {
      }
    },
    removeFromGraph (state, node) {
      state.graph.remove(node)
    },
    clearGraph (state) {
      state.graph.clear()
    },
    setHoveredGraphNode (state, hoveredNode) {
      state.hoveredGraphNode = hoveredNode
    },
    setSearchResults (state, { text, label, refObjs }) {
      state.isSearched = true
      state.searchText = text || state.searchText
      state.searchRefObjs = refObjs
      state.searchLabel =
        label || { text: 'Search Results', refObj: { title: '' } }
    },
    setSearchRefObjs (state, refObjs) {
      state.searchRefObjs = refObjs
    },
    selectUserCollection (state, index) {
      state.visPaneCollection = state.collections[index]
      state.graph = state.collections[index].graph
      if (!state.isVisPaneVisible) {
        state.isCollectionBarVisible = true
        state.isSearchPaneVisible = true
        state.isVisPaneVisible = true
        state.isSearched = true
        state.visPaneState = 'full'
      }
    },
    createUserCollection (state, collection) {
      state.collections.push(collection)
    },
    createVisPaneCollection (state) {
      const collection = { name: '', graph: state.graph }
      state.collections.push(collection)
      state.visPaneCollection = collection
    },
    setVisPaneCollectionName (state, text) {
      state.visPaneCollection.name = text
    },
    toggleVisPaneLOD (state) {
      if (state.visPaneLOD === 'full') {
        state.visPaneLOD = 'author'
      } else if (state.visPaneLOD === 'author') {
        state.visPaneLOD = 'title'
      } else if (state.visPaneLOD === 'title') {
        state.visPaneLOD = 'full'
      }
    }
  },
  getters: {
    isSignedIn: state => {
      return state.isSignedIn
    },
    isUserCollectionDropdownVisible: state => {
      return state.enableUserCollectionDropdown && state.isSignedIn
    },
    layout: state => {
      return !state.isSearched
        ? 'home'
        : !state.isVisPaneVisible
          ? state.searchPaneState
          : state.visPaneState === 'full'
            ? 'collection'
            : state.visPaneState + state.searchPaneState
    },
    currCollectionId: state => {
      return _.indexOf(state.collections, state.visPaneCollection)
    }
  }
})
