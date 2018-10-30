import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'
import { Graph } from './components/kanbangraph.js'

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
    visPaneCollection: 'history'
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
    showRelatedTestRefObjs (context, { relation, refObj }) {
      const node = context.state.testGraph.nodes[refObj.doi]
      const relatedNodeIds =
        relation === 'citing'
          ? node.inGraphCitings
          : relation === 'citedBy'
            ? node.inGraphCitedBys
            : []
      context.commit(
        'setSearchRefObjs',
        _.map(
          relatedNodeIds,
          nodeId => context.state.testGraph.nodes[nodeId].paper))
      context.commit(
        'setSearchLabel',
        {
          refObj: refObj,
          text:
            relation === 'citing'
              ? `References of`
              : relation === 'citedBy'
                ? `Articles that are citing`
                : ''
        }
      )
      if (context.state.visPaneState === 'full') {
        context.commit('setVisPaneState', 'major')
      }
    }
  },
  mutations: {
    toHome (state) {
      state.isCollectionBarVisible = false
      state.isSearchPaneVisible = true
      state.isVisPaneVisible = false
      state.visPaneState = 'minor'
      state.isSearched = false
      state.graph = new Graph([])
      state.visPaneCollection = 'history'
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
    search (state, text) {
      if (_.isEmpty(text)) {
        return
      }
      state.isSearched = true
      state.searchText = text
      state.searchRefObjs = _.map(state.testGraph.nodes, node => node.paper)
      state.searchLabel = {
        text: 'Search Results',
        refObj: { title: '' }
      }
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
    }
  },
  getters: {
    isSignedIn: function (state) {
      return state.isSignedIn
    }
  }
})
