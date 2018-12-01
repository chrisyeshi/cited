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
    currUser: undefined,
    // enables
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
    search (context, text) {
      const collId = context.getters.currCollectionId
      const random = Date.now()
      if (collId) {
        router.push(`/smooth/search/${text}/collection/${collId}#${random}`)
      } else {
        router.push(`/smooth/search/${text}#${random}`)
      }
    },
    showRefObjDetail (context, refObjId) {
      const collId = context.getters.currCollectionId
      if (collId) {
        router.push(`/smooth/refobj/${refObjId}/collection/${collId}`)
      } else {
        router.push(`/smooth/refobj/${refObjId}`)
      }
    },
    selectUserCollection (context, collId) {
      router.push(`/smooth/collection/${collId}`)
    },
    async pushToHistory (context, refObjId) {
      const refObj = await api.getRefObj(refObjId)
      context.commit('insertToHistory', refObj)
    },
    setCurrUser (context, user) {
      const colls = _.map(user.collections, coll => ({
        ...coll,
        graph: Graph.fromCollection(coll)
      }))
      context.commit('setState', {
        currUser: { ...user, collections: colls }
      })
    },
    async signIn (context, { email, password }) {
      const user = await api.signIn(email, password)
      if (!user) {
        console.log('invalide user')
      } else {
        context.dispatch('setCurrUser', user)
      }
    },
    logout (context) {
      api.logout()
      context.commit('setState', { currUser: null })
    },
    async isServerSignedIn (context) {
      const user = await api.me()
      if (!user) {
        context.commit('setState', { currUser: null })
      } else {
        context.dispatch('setCurrUser', user)
      }
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
      if (!state.historyGraph.includes(refObj)) {
        state.historyGraph.insert(refObj)
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
    createUserCollection (state, collection) {
      state.currUser.collections.push(collection)
    },
    createVisPaneCollection (state) {
      const collection = { name: '', graph: state.graph }
      state.currUser.collections.push(collection)
      state.visPaneCollection = collection
    },
    setVisPaneCollectionName (state, text) {
      state.visPaneCollection.title = text
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
      return !!state.currUser
    },
    isUserCollectionDropdownVisible: state => {
      return state.enableUserCollectionDropdown && !!state.currUser
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
      return state.visPaneCollection.id
    },
    currCollTitle: state => {
      return state.visPaneCollection === 'history'
        ? 'history' : state.visPaneCollection.title
    },
    myCollections: state => {
      return !state.currUser
        ? []
        : !state.currUser.collections
          ? []
          : state.currUser.collections
    }
  }
})
