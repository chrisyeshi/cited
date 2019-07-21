import query from '../../../academic_apis/arxiv.js'

export default {
  async signIn (email, password) {
    return null
  },

  async logout () {
    return null
  },

  async me () {
    return null
  },

  async searchRefObjs (text) {
    const results = await query({
      searchQuery: `all:${text}`,
      start: 0,
      maxResults: 20
    })
    console.log(results)
    return []
  },

  async getRefObj (refObjId) {
    return null
  },

  async getReferences (refObjId) {
    return { refObj: null, references: [] }
  },

  async getCitedBys (refObjId) {
    return { refObj: null, citedBys: [] }
  },

  async getCommonRelatives (refObjIds) {
    return { refObjs: [], relatives: [] }
  }
}
