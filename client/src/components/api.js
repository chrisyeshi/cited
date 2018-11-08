import testData from './testdata.js'

export class API {
  constructor (impl) {
    this.impl = impl
    this.impl.initialize()
  }

  async searchRefObjs (text, { offset = 0, count = 20 } = {}) {
    return this.impl.searchRefObjs(text, { offset, count })
  }

  async getRefObj (refObjId) {
    return this.impl.getRefObj(refObjId)
  }

  async getRefObjs (refObjIds) {
    return this.impl.getRefObjs(refObjIds)
  }

  async getReferences (refObjId, { offset = 0, count = 20 } = {}) {
    return this.impl.getReferences(refObjId, { offset, count })
  }

  async getCitedBys (refObjId, { offset = 0, count = 20 } = {}) {
    return this.impl.getCitedBys(refObjId, { offset, count })
  }

  async getCommonRelatives (refObjIds, opt) {
    return this.impl.getCommonRelatives(refObjIds, opt)
  }
}

export default new API(testData)
