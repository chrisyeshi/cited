export default {
  namespaced: true,
  state: {
    contentState: 'vis-view'
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
