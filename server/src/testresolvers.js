import _ from 'lodash'
import * as data from '../static/insitupdf.json'
import { Graph } from './graph.js'

let graph = Graph.fromTestJson({
  papers: data.references,
  relations: data.relations
})

let getRefObj = id => _.find(graph.nodes, node => node.paper.id === id).paper

export default {
  Query: {
    search (obj, { text }, context, info) {
      return _.map(graph.nodes, node => node.paper)
    },
    refObj (obj, { id }, context, info) {
      return getRefObj(id)
    }
  },
  RefObj: {
    references (refObj, args, context, info) {
      return _.map(refObj.citings, ({ id }) => getRefObj(id))
    },
    citedBys (refObj, args, context, info) {
      return _.map(refObj.citedBys, ({ id }) => getRefObj(id))
    }
  }
}
