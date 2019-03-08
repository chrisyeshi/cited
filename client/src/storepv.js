export default {
  namespaced: true,
  state: {
    contentState: 'vis-view',
    articleEditable: false
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
