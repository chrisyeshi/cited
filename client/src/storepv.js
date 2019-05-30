export default {
  namespaced: true,
  state: {
    contentState: 'vis-view',
    drawerState: 'collection-list',
    articleEditable: false,
    currUserId: null,
    currCollId: null,
    currArtId: null,
    sampleCollections: []
  },
  mutations: {
    set (state, newState) {
      Object.assign(state, { ...state, ...newState })
    }
  },
  actions: {

  },
  getters: {

  }
}
