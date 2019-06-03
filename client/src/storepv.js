const defaultState = {
  contentState: 'home-view',
  drawerState: {
    name: 'pv-drawer-collection-list',
    props: {}
  },
  articleEditable: false,
  currUserId: null,
  currCollId: null,
  currArtId: null,
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
    }
  },
  actions: {

  },
  getters: {

  }
}
