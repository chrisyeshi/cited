import Vue from 'vue'
import Vuex from 'vuex'
import _ from 'lodash'

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
    collectionTitle: '',
    cards: []
  },
  actions: {
    toHome (context) {
      context.commit('setCollectionBarVisible', false)
      context.commit('setSearchPaneVisible', true)
      context.commit('setVisPaneVisible', false)
      context.commit('setVisPaneState', 'minor')
      context.commit('setIsSearched', false)
      context.commit('clearCards')
    },
    toSearchCollection (context) {
      context.commit('setCollectionBarVisible', true)
      context.commit('setSearchPaneVisible', true)
      context.commit('setVisPaneVisible', true)
      context.commit('setVisPaneState', 'minor')
      context.commit('setCollectionTitle', 'collection: ' + context.state.searchText)
    },
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
    search (context, text) {
      if (_.isEmpty(text)) {
        return
      }
      context.commit('setIsSearched', true)
      context.commit('setSearchText', text)
    }
  },
  mutations: {
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
    setCollectionTitle (state, text) {
      state.collectionTitle = text
    },
    clearCards (state) {
      state.cards = []
    },
    pushCard (state, card) {
      state.cards.push(card)
    }
  },
  getters: {
    isSignedIn: function (state) {
      return state.isSignedIn
    }
  }
})
