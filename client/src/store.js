import _ from 'lodash'
import * as firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/functions'
import {
  fromColl as computeHierarchicalTags
} from '@/components/hierarchicaltags.js'
import { VisGraph } from '@/components/visgraph.js'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const defaultFilters = {
  yearMin: null,
  yearMax: null,
  tagSelects: {}
}

const defaultState = {
  contentState: 'home-view',
  drawerState: {
    name: 'pv-drawer-collection-list',
    props: {}
  },
  articleEditable: false,
  currUserId: null,
  currCollId: null,
  currColl: null,
  currVisGraph: null,
  currHierTags: null,
  currArtId: null,
  currArt: null,
  filters: defaultFilters,
  isDrawerOpen: true,
  temporaryArticleIds: [],
  hoveringArticleId: null,
  selectedArticleIds: []
}

const parseVis = {
  namespaced: true,
  state: { ...defaultState },
  mutations: {
    set (state, newState) {
      Object.assign(state, { ...state, ...newState })
    },
    reset (state) {
      Object.assign(state, defaultState)
    },
    setFilters (state, filters) {
      Object.assign(state.filters, { ...state.filters, ...filters })
    },
    setCollArtId (state, { collId, artId }) {
      // commit state
      if (!collId && !artId) {
        // landing page or home view
        Object.assign(state, {
          contentState: 'home-view',
          currCollId: null,
          currColl: null,
          currVisGraph: null,
          currArtId: null,
          currArt: null,
          drawerState: { name: 'pv-drawer-collection-list' }
        })
        return
      }
      if (collId && !artId) {
        // vis view with collection drawer
        Object.assign(state, {
          contentState: 'vis-view',
          currCollId: collId,
          currArtId: null,
          currArt: null,
          drawerState: { name: 'pv-drawer-collection-view' }
        })
        return
      }
      if (collId && artId) {
        // vis view with article drawer
        Object.assign(state, {
          contentState: 'vis-view',
          currCollId: collId,
          currArtId: artId,
          drawerState: { name: 'pv-drawer-article-view' }
        })
        return
      }
      if (!collId && artId) {
        // TODO: article view
        throw new Error('full screen article view is not implemented yet.')
      }
      throw new Error(`unknown information for fetching collections:
        collId = ${collId} and artId = ${artId}`)
    }
  },
  actions: {
    async setCollArt (context, { collId, artId }) {
      const prevCollId = context.state.currCollId
      const prevArtId = context.state.currArtId
      context.commit('setCollArtId', { collId, artId })
      if (prevCollId === collId && prevArtId === artId) {
        return
      }
      let currColl = _.isNil(collId) ? null : context.state.currColl
      let currVisGraph = _.isNil(collId) ? null : context.state.currVisGraph
      let currHierTags = _.isNil(collId) ? null : context.state.currHierTags
      let currArt = _.isNil(artId) ? null : context.state.currArt
      if (prevCollId !== collId && !_.isNil(collId)) {
        // collection changes
        const docRef = firebase.firestore().doc(`collections/${collId}`)
        const snapshot = await docRef.get()
        const coll = snapshot.data()
        currColl = coll
        currVisGraph = VisGraph.fromColl(currColl)
        // compute hierarchical tags
        currHierTags = computeHierarchicalTags(coll)
      }
      if (prevArtId !== artId && !_.isNil(artId)) {
        // article changes
        const docRef = firebase.firestore().doc(`articles/${artId}`)
        const snapshot = await docRef.get()
        currArt = {
          ...snapshot.data(),
          artHash: artId
        }
      }
      context.commit('set', {
        currColl, currVisGraph, currHierTags, currArt
      })
    },
    async fetchSemanticScholar (context, semanticScholarId) {
      const artQuery = firebase.firestore().collection('articles')
        .where('externs.semanticScholar', '==', semanticScholarId)
      const artQuerySnap = await artQuery.get()
      const currArt = artQuerySnap.empty
        ? await firebase.functions()
            .httpsCallable('fetchSemanticScholar')(semanticScholarId)
        : { ...artQuerySnap.docs[0].data(), artHash: artQuerySnap.docs[0].id }
      context.commit(
        'setCollArtId', { collId: currArt.artHash, artId: currArt.artHash })
      console.log(currArt)
      const collRef = firebase.firestore().doc(`collections/${currArt.artHash}`)
      const collSnap = await collRef.get()
      const currColl = collSnap.data()
      const currVisGraph = VisGraph.fromColl(currColl)
      context.commit('set', {
        currColl, currVisGraph, currArt
      })
    }
  },
  getters: {

  }
}

export default new Vuex.Store({
  modules: {
    parseVis
  },
  state: {

  },
  mutations: {

  },
  actions: {

  }
})
