import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'
import { Graph } from './components/kanbangraph.js'
import { Paper } from './components/paper.js'
import router from './router/index.js'
import api from './components/api.js'
import loremIpsum from 'lorem-ipsum'

Vue.use(Vuex)

const demoSearchText = 'big data analytics graphs'
const demoPapers = {
  bigDataVis: {
    id: 'bigDataVis',
    title: 'Big-Data Visualization',
    abstract: 'abstract: ' + loremIpsum({ count: 10 }),
    venue: { name: 'workshop: ' + loremIpsum({ count: 2, units: 'words' }) },
    authors: [ { family: 'Keim', given: 'Daniel' } ],
    year: 2013,
    referenceCount: 50,
    citedByCount: 85
  },
  bigDataAnalytics: {
    id: 'bigDataAnalytics',
    title: 'A Paper about Big Data Analytics',
    abstract: 'abstract: ' + loremIpsum({ count: 10 }),
    venue: { name: 'workshop: ' + loremIpsum({ count: 2, units: 'words' }) },
    authors: [{
      family: 'author',
      given: loremIpsum({ count: 1, units: 'words' })
    }],
    year: 2015,
    referenceCount: 35,
    citedByCount: 34
  },
  bigDataGraph: {
    id: 'bigDataGraph',
    title: 'A Paper about Scatterplots with Big Data',
    abstract: 'abstract: ' + loremIpsum({ count: 10 }),
    venue: { name: 'workshop: ' + loremIpsum({ count: 2, units: 'words' }) },
    authors: [{
      family: 'author',
      given: loremIpsum({ count: 1, units: 'words' })
    }],
    year: 2015,
    referenceCount: 65,
    citedByCount: 61
  }
}

export default new Vuex.Store({
  state: {
    isSearchPaneVisible: true,
    isVisPaneVisible: false,
    visPaneState: 'minor',
    searchPaneState: 'search',
    isSearched: false,
    searchText: null,
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
    showAllRelations: false,
    isDrawerVisible: false,
    currUser: undefined,
    layout: 'vis',
    initSearchText: 'visualization',
    isTour: false,
    currTourStep: 0,
    tourText: '',
    tourReferenceSelector: null,
    popperPlacement: '',
    // enables
    enableSignIn: true,
    enableUserCollectionDropdown: false,
    enableDrawer: true,
    enableDrawerTemporary: false,
    enableInitSearchText: true
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
      const refObjIds = _.map(refObjs, refObj => refObj.id)
      const text = _.join(refObjIds, '&')
      context.dispatch('search', 'common:' + text)
    },
    search (context, text) {
      const collId = context.getters.currCollectionId
      const random = Date.now()
      if (collId) {
        router.push(`/demo/search/${text}/collection/${collId}#${random}`)
      } else {
        router.push(`/demo/search/${text}#${random}`)
      }
    },
    showRefObjDetail (context, refObjId) {
      const collId = context.getters.currCollectionId
      if (collId) {
        router.push(`/demo/refobj/${refObjId}/collection/${collId}`)
      } else {
        router.push(`/demo/refobj/${refObjId}`)
      }
    },
    selectUserCollection (context, collId) {
      router.push(`/demo/collection/${collId}`)
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
    },
    async toTourStep (context, tourStep) {
      if (tourStep === 0) {
        context.commit('setState', {
          isTour: true,
          currTourStep: tourStep,
          tourText: `We aim to help researchers discover papers when they don't know the specific keywords. For example, let's say we want to find a solution for analyzing big data and generate some graphs to present the results. We search "big data analytics graphs".`,
          tourReferenceSelector: '#home-search-box',
          popperPlacement: 'bottom',
          layout: 'search',
          searchText: null,
          initSearchText: demoSearchText
        })
      } else if (tourStep === 1) {
        context.commit('setState', {
          isTour: true,
          currTourStep: tourStep,
          tourText: `We can see that the first paper looks interesting. Let's add it to the history collection.`,
          tourReferenceSelector: '#search-paper-0 .addToCurrColl',
          popperPlacement: 'bottom',
          layout: 'search',
          searchText: demoSearchText,
          searchLabel: { text: 'Search Results', refObj: { title: '' } },
          searchRefObjs: [
            demoPapers.bigDataAnalytics,
            demoPapers.bigDataGraph
          ],
          currRefObj: null,
          visPaneCollection: 'history',
          graph: new Graph([]),
          showAllRelations: false
        })
      } else if (tourStep === 2) {
        context.commit('setState', {
          isTour: true,
          currTourStep: tourStep,
          tourText: `The second paper also looks promising. Let's add it too.`,
          tourReferenceSelector: '#search-paper-1 .addToCurrColl',
          popperPlacement: 'bottom',
          layout: 'searchMajor',
          searchText: demoSearchText,
          searchLabel: { text: 'Search Results', refObj: { title: '' } },
          searchRefObjs: [
            demoPapers.bigDataAnalytics,
            demoPapers.bigDataGraph
          ],
          currRefObj: null,
          visPaneCollection: 'history',
          graph: new Graph([
            {
              paper: demoPapers.bigDataAnalytics,
              inGraphCitings: [],
              inGraphCitedBys: []
            }
          ]),
          showAllRelations: false
        })
      } else if (tourStep === 3) {
        context.commit('setState', {
          isTour: true,
          currTourStep: tourStep,
          tourText: `Though both papers are related to what we are looking for, they still seem to be off the mark by a little bit. We can then utilize the citation network to find the common references/citations of both papers.`,
          tourReferenceSelector: '#vis-year-2015',
          popperPlacement: 'left',
          layout: 'searchMajor',
          searchText: demoSearchText,
          searchLabel: { text: 'Search Results', refObj: { title: '' } },
          searchRefObjs: [
            demoPapers.bigDataAnalytics,
            demoPapers.bigDataGraph
          ],
          currRefObj: null,
          visPaneCollection: 'history',
          graph: new Graph([
            {
              paper: demoPapers.bigDataAnalytics,
              inGraphCitings: [],
              inGraphCitedBys: []
            },
            {
              paper: demoPapers.bigDataGraph,
              inGraphCitings: [],
              inGraphCitedBys: []
            }
          ]),
          showAllRelations: false
        })
      } else if (tourStep === 4) {
        context.commit('setState', {
          isTour: true,
          currTourStep: tourStep,
          tourText: `We can select both papers on the right panel and find the common relatives of them with this button.`,
          tourReferenceSelector: '#vis-common-relative',
          popperPlacement: 'left',
          layout: 'searchMajor',
          searchText: demoSearchText,
          searchLabel: { text: 'Search Results', refObj: { title: '' } },
          searchRefObjs: [
            demoPapers.bigDataAnalytics,
            demoPapers.bigDataGraph
          ],
          currRefObj: null,
          visPaneCollection: 'history',
          graph: new Graph([
            {
              paper: demoPapers.bigDataAnalytics,
              inGraphCitings: [],
              inGraphCitedBys: [],
              isSelected: true
            },
            {
              paper: demoPapers.bigDataGraph,
              inGraphCitings: [],
              inGraphCitedBys: [],
              isSelected: true
            }
          ]),
          showAllRelations: false
        })
      } else if (tourStep === 5) {
        context.commit('setState', {
          isTour: true,
          currTourStep: tourStep,
          tourText: `This is a paper that is cited by both papers on the right, and it seems to be the exact paper we are looking for. Let's also add it to the collection.`,
          tourReferenceSelector: '#search-paper-0 .addToCurrColl',
          popperPlacement: 'bottom',
          layout: 'searchMajor',
          searchText: demoSearchText,
          searchLabel: {
            text: 'Common Relatives of',
            refObj: [ demoPapers.bigDataAnalytics, demoPapers.bigDataGraph ]
          },
          searchRefObjs: [ demoPapers.bigDataVis ],
          currRefObj: null,
          visPaneCollection: 'history',
          graph: new Graph([
            {
              paper: demoPapers.bigDataAnalytics,
              inGraphCitings: [],
              inGraphCitedBys: []
            },
            {
              paper: demoPapers.bigDataGraph,
              inGraphCitings: [],
              inGraphCitedBys: []
            }
          ]),
          showAllRelations: false
        })
      } else if (tourStep === 6) {
        context.commit('setState', {
          isTour: true,
          currTourStep: tourStep,
          tourText: `Here we can see the relations of the papers indicated by the red lines. We believe such graph can provide a better paper discovery experience that is tailored to researchers' habbits.`,
          tourReferenceSelector: '#vis-year-2015',
          popperPlacement: 'left',
          layout: 'searchMajor',
          searchText: demoSearchText,
          searchLabel: {
            text: 'Common Relatives of',
            refObj: [ demoPapers.bigDataAnalytics, demoPapers.bigDataGraph ]
          },
          searchRefObjs: [ demoPapers.bigDataVis ],
          currRefObj: null,
          visPaneCollection: 'history',
          graph: new Graph([
            {
              paper: demoPapers.bigDataAnalytics,
              inGraphCitings: [ 'bigDataVis' ],
              inGraphCitedBys: []
            },
            {
              paper: demoPapers.bigDataGraph,
              inGraphCitings: [ 'bigDataVis' ],
              inGraphCitedBys: []
            },
            {
              paper: demoPapers.bigDataVis,
              inGraphCitings: [],
              inGraphCitedBys: [ 'bigDataAnalytics', 'bigDataGraph' ]
            }
          ]),
          showAllRelations: true
        })
      } else if (tourStep === 7) {
        context.commit('setState', {
          isTour: false,
          showAllRelations: false,
          layout: 'vis',
          currRefObj: null,
          searchText: null
        })
        router.push('/demo/collection/insituvis')
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
