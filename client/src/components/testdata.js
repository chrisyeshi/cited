import * as data from './insitupdf.json'
import { Graph } from './kanbangraph.js'
import _ from 'lodash'

const graph = Graph.fromTestJson({
  papers: data.references,
  relations: data.relations
})
let isSignedIn = true
const user = {
  id: 'user-id',
  email: 'Guest',
  password: 'hello, world!',
  collections: [
    {
      id: 'insituvis',
      title: 'in situ visualization',
      nodes: _.map(graph.nodes, graphNode => ({
        refObj: graphNode.paper,
        inCollectionReferences: graphNode.inGraphCitings,
        inCollectionCitedBys: graphNode.inGraphCitedBys
      }))
    }
  ]
}

function getRawRefObj (refObjId) {
  return graph.getNodeById(refObjId).paper
}

function getRawRefObjs (refObjIds) {
  return _.map(refObjIds, getRawRefObj)
}

export default {

  async signIn (email, password) {
    isSignedIn = true
    return user
  },

  async logout () {
    isSignedIn = false
    return user
  },

  async me () {
    return isSignedIn ? user : null
  },

  async searchRefObjs (text) {
    const words = _.words(_.toLower(text))
    const nodes = _.filter(graph.nodes, ({ paper }) => {
      const serialized = _.toLower(JSON.stringify(paper))
      const hasWords = _.map(words, word => _.includes(serialized, word))
      return !_.includes(hasWords, false)
    })
    if (nodes.length > 0) {
      return _.map(nodes, ({ paper }) => paper)
    }
    // return the whole list when nothing matches...
    return _.map(graph.nodes, ({ paper }) => paper)
  },

  async getRefObj (refObjId) {
    const rawRefObj = getRawRefObj(refObjId)
    const refObj = {
      ...rawRefObj,
      referenceCount: rawRefObj.nCitings,
      references: _.map(rawRefObj.references, getRawRefObj),
      citedByCount: rawRefObj.nCitedBys
    }
    return refObj
  },

  async getReferences (refObjId) {
    const refObj = getRawRefObj(refObjId)
    const references = getRawRefObjs(refObj.references)
    return {
      refObj: refObj,
      references: references
    }
  },

  async getCitedBys (refObjId) {
    const refObj = getRawRefObj(refObjId)
    const citedBys = getRawRefObjs(refObj.citedBys)
    return {
      refObj: refObj,
      citedBys: citedBys
    }
  },

  async getCommonRelatives (refObjIds) {
    const refObjs = getRawRefObjs(refObjIds)
    const commonReferences =
      _.intersectionBy(
        ...(_.map(refObjs, refObj => refObj.references)),
        refObjId => refObjId)
    const commonCitedBys =
      _.intersectionBy(
        ...(_.map(refObjs, refObj => refObj.citedBys)),
        refObjId => refObjId)
    const resRefObjIds = [ ...commonReferences, ...commonCitedBys ]
    return {
      refObjs: refObjs,
      relatives: getRawRefObjs(resRefObjIds)
    }
  }
}
