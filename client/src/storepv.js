import _ from 'lodash'
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
      let currArt = _.isNil(artId) ? null : context.state.currArt
      if (prevCollId !== collId && !_.isNil(collId)) {
        // collection changes
        const docRef = firebase.firestore().doc(`collections/${collId}`)
        const snapshot = await docRef.get()
        const coll = snapshot.data()
        currColl = coll
        currVisGraph = VisGraph.fromColl(currColl)
      }
      if (prevArtId !== artId && !_.isNil(artId)) {
        // article chanages
        const docRef = firebase.firestore().doc(`articles/${artId}`)
        const snapshot = await docRef.get()
        if (snapshot.exists) {
          currArt = snapshot.data()
        } else {
          currArt = currVisGraph ? currVisGraph.getArt(artId) : null
        }
      }
      context.commit('set', {
        currColl, currVisGraph, currArt
      })
    }
  },
  getters: {

  }
}
