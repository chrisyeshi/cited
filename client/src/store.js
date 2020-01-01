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
  recentColls: [],
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
    async fetchCollArt (context, { collId, artId }) {
      const fetchArtBySsId =
        firebase.functions().httpsCallable('fetchArtBySsId')
      const fetchArtRefColl =
        firebase.functions().httpsCallable('fetchArtRefColl')
      const fetchArt = async (artHash) => {
        if (!artHash) {
          return null
        }
        const artRef = firebase.firestore().doc(`articles/${artHash}`)
        const artSnap = await artRef.get()
        return artSnap.exists
          ? { ...artSnap.data(), artHash: artSnap.id }
          : null
      }
      const fetchColl = async (collId) => {
        const collRef = firebase.firestore().doc(`collections/${collId}`)
        const collSnap = await collRef.get()
        return collSnap.exists
          ? { ...collSnap.data(), collId: collSnap.id }
          : null
      }
      const currArt = await fetchArt(artId)
      const isArtHash = _.toInteger(_.property('[1]')(_.split(collId, '-')))
      if (isArtHash) {
        context.commit('setCollArtId', { collId: collId, artId: artId })
        const [ citedBy, coll ] =
          await Promise.all([ await fetchArt(collId), await fetchColl(collId) ])
        if (!citedBy || !coll) {
          throw new Error(`there is no ${collId} in articles or collections`)
        }
        const currColl = { ...coll, citedBy }
        const currVisGraph = VisGraph.fromColl(currColl)
        context.commit('set', { currColl, currVisGraph, currArt })

      } else {
        const { data: { art: citedBy, ssArt: ssCitedBy } } =
          await fetchArtBySsId(collId)
        context.commit('setCollArtId', { collId: collId, artId: artId })
        const dbCollSnap =
          await firebase.firestore().doc(`collections/${citedBy.artHash}`).get()
        if (dbCollSnap.exists) {
          const currColl = { ...dbCollSnap.data(), citedBy }
          const currVisGraph = VisGraph.fromColl(currColl)
          context.commit('set', { currColl, currVisGraph, currArt })
        } else {
          await Promise.all(_.map(ssCitedBy.references, async reference => {
            await fetchArtBySsId(reference.externs.semanticScholar)
          }))
          const { data: coll } = await fetchArtRefColl(citedBy.artHash)
          const currColl = { ...coll, citedBy }
          const currVisGraph = VisGraph.fromColl(currColl)
          context.commit('set', { currColl, currVisGraph, currArt })
        }
      }
    },
    async fetchRecentColls (context) {
      const collMetasSnap =
        await firebase.firestore().collection('collMetas').limit(20).get()
      const collMetas = _.map(collMetasSnap.docs, collMetaSnap => ({
        ...collMetaSnap.data(),
        collId: collMetaSnap.id
      }))
      const artMetas =
        await Promise.all(_.map(collMetas, async ({ collId }) => {
          const artMetaSnap =
            await firebase.firestore().doc(`artMetas/${collId}`).get()
          return artMetaSnap.exists
            ? {
                ...artMetaSnap.data(),
                artId: artMetaSnap.id
              }
            : null
        }))
      const colls =
        _.filter(_.map(_.zip(collMetas, artMetas), ([ collMeta, artMeta ]) => {
          if (!artMeta) {
            return null
          }
          return {
            ...artMeta,
            ...collMeta,
            description: artMeta.abstract
          }
        }))
      context.commit('set', { recentColls: colls })
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
