import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'
import { Graph } from './components/kanbangraph.js'
import { Paper } from './components/paper.js'
import router from './router/index.js'
import api from './components/api.js'
import getNextLayout from './components/getnextlayout.js'

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
    async search (context, text) {
      if (_.isEmpty(text)) {
        return
      }
      const query = { search: text }
      query.layout = getNextLayout(context.getters.layout, {
        'search': [ 'home', 'refobj' ],
        'majorsearch': 'collection'
      })
      if (context.getters.currCollectionId) {
        query.collection = context.getters.currCollectionId
      }
      router.push({ path: '/smooth', query: query })
    },
    async showRefObjDetail (context, refObjId) {
      const query = { refobj: refObjId }
      query.layout = getNextLayout(context.getters.layout, {
        'refobj': [ 'home', 'search' ],
        'majorrefobj': [ 'collection', 'majorsearch' ],
        'minorrefobj': 'minorsearch'
      })
      if (context.getters.currCollectionId >= 0) {
        query.collection = context.getters.currCollectionId
      }
      router.push({ path: '/smooth', query: query })
    },
    async pushToHistory (context, refObjId) {
      const refObj = await api.getRefObj(refObjId)
      context.commit('insertToHistory', refObj)
    },
    selectUserCollection (context, collId) {
      const query = { collection: collId }
      query.layout = getNextLayout(context.getters.layout, {
        'collection': 'home',
        'minorsearch': 'search',
        'minorrefobj': 'refobj'
      })
      if (context.state.currRefObj) {
        query.refobj = context.state.currRefObj.id
      }
      router.push({
        path: '/smooth',
        query: query
      })
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
    selectUserCollection (state, collId) {
      state.visPaneCollection =
        _.find(state.currUser.collections, coll => coll.id === collId)
      state.graph = state.visPaneCollection.graph
      if (!state.isVisPaneVisible) {
        state.isCollectionBarVisible = true
        state.isSearchPaneVisible = true
        state.isVisPaneVisible = true
        state.isSearched = true
        state.visPaneState = 'full'
      }
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
    myCollections: state => {
      return !state.currUser
        ? []
        : !state.currUser.collections
          ? []
          : state.currUser.collections
    }
  }
})
