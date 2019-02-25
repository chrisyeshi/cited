import { ArticlePool } from './components/pvmodels.js'

export default {
  namespaced: true,
  state: {
    contentState: 'vis-view',
    articlePool: new ArticlePool()
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
