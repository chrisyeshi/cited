import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'
import { Graph } from './components/kanbangraph.js'
import api from './components/api.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    isSignedIn: false,
    isCollectionBarVisible: false,
    isSearchPaneVisible: true,
    isVisPaneVisible: false,
    visPaneState: 'minor',
    isSearched: false,
    searchText: '',
    searchLabel: { text: '', refObj: { title: '' } },
    collectionTitle: '',
    graph: new Graph([]),
    hoveredGraphNode: null,
    testGraph: new Graph([]),
    searchRefObjs: [],
    collections: [],
    visPaneCollection: 'history',
    currRefObj: null,
    visPaneLOD: 'full'
  },
  actions: {
    toggleVisPaneState (context) {
      if (context.state.visPaneState === 'minor') {
        context.commit('setVisPaneState', 'major')
      } else if (context.state.visPaneState === 'major') {
        context.commit('setVisPaneState', 'full')
      } else if (context.state.visPaneState === 'full') {
        context.commit('setVisPaneState', 'minor')
      }
    },
    toggleIsSearched (context) {
      context.commit('setIsSearched', !context.state.isSearched)
    },
    async showRelatedRefObjs (context, { relation, refObj }) {
      const refObjs =
        relation === 'citing'
          ? await api.getReferences(refObj.id)
          : await api.getCitedBys(refObj.id)
      context.commit(
        'setSearchResults',
        {
          label: {
            refObj: refObj,
            text: relation === 'citing'
              ? `References of`
              : `Articles that are citing` },
          refObjs: refObjs
        })
      if (context.state.visPaneState === 'full') {
        context.commit('setVisPaneState', 'major')
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
      const refObjs = await api.searchRefObjs(text)
      context.commit('setSearchResults', { text: text, refObjs: refObjs })
    },
    async setCurrRefObj (context, refObjId) {
      const refObj = await api.getRefObj(refObjId)
      context.commit('set', { prop: 'currRefObj', value: refObj })
    }
  },
  mutations: {
    set (state, { prop, value }) {
      state[prop] = value
    },
    toHome (state) {
      state.isCollectionBarVisible = false
      state.isSearchPaneVisible = true
      state.isVisPaneVisible = false
      state.visPaneState = 'minor'
      state.isSearched = false
      state.graph = new Graph([])
      state.visPaneCollection = 'history'
      state.currRefObj = null
    },
    toSearchCollection (state) {
      state.isCollectionBarVisible = true
      state.isSearchPaneVisible = true
      state.isVisPaneVisible = true
      state.visPaneState = 'minor'
      state.collectionTitle = `collection: ${state.searchText}`
    },
    change (state, to) {
      state = { ...state, ...to }
    },
    toggleIsSignedIn (state) {
      state.isSignedIn = !state.isSignedIn
    },
    setCollectionBarVisible (state, visible) {
      state.isCollectionBarVisible = visible
    },
    setSearchPaneVisible (state, visible) {
      state.isSearchPaneVisible = visible
    },
    setVisPaneVisible (state, visible) {
      state.isVisPaneVisible = visible
    },
    setVisPaneState (state, visPaneState) {
      state.visPaneState = visPaneState
    },
    setIsSearched (state, isSearched) {
      state.isSearched = isSearched
    },
    setSearchText (state, text) {
      state.searchText = text
    },
    setSearchLabel (state, labelObj) {
      state.searchLabel = labelObj
    },
    setCollectionTitle (state, text) {
      state.collectionTitle = text
    },
    toggleNodeSelected (state, node) {
      state.graph.toggleSelected(node)
    },
    clearSelectedNodes (state) {
      state.graph.deselectAllNodes()
    },
    insertToGraph (state, refObj) {
      state.graph.insert(refObj)
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
      state.currRefObj = null
    },
    setTestGraph (state, testGraph) {
      state.testGraph = testGraph
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
    isSignedIn: function (state) {
      return state.isSignedIn
    }
  }
})
