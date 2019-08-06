import * as firebase from 'firebase/app'
import 'firebase/firestore'
import { VisGraph } from '@/components/visgraph.js'

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
  currArtId: null,
  currArt: null,
  temporaryArticleIds: [],
  hoveringArticleId: null,
  selectedArticleIds: []
}

export default {
  namespaced: true,
  state: { ...defaultState },
  mutations: {
    set (state, newState) {
      Object.assign(state, { ...state, ...newState })
    },
    reset (state) {
      Object.assign(state, defaultState)
    },
    setCollArtId (state, { collId, artId }) {
      // commit state
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
      throw new Error('unknown information for fetching collections.')
    }
  },
  actions: {
    async setCollArt (context, { collId, artId }) {
      if (context.state.currCollId === collId &&
          context.state.currArtId === artId) {
        // nothing changes
        return
      }
      const prevCollId = context.state.currCollId
      const prevArtId = context.state.currArtId
      context.commit('setCollArtId', { collId, artId })
      let currColl = null
      let currVisGraph = null
      let currArt = null
      if (prevCollId !== collId) {
        // collection changes
        const docRef = firebase.firestore().doc(`collections/${collId}`)
        const snapshot = await docRef.get()
        const coll = snapshot.data()
        currColl = coll
        currVisGraph = VisGraph.fromColl(currColl)
      }
      if (prevArtId !== artId) {
        // article chanages
        const docRef = firebase.firestore().doc(`articles`)
        const snapshot = await docRef.get()
        const art = snapshot.data()
        currArt = art
      }
      context.commit('set', {
        currColl, currVisGraph, currArt
      })
    }
  },
  getters: {

  }
}
