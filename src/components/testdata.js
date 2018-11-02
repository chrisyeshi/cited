import { Graph } from './kanbangraph.js'
import _ from 'lodash'

export default {

  graph: new Graph([]),

  async initialize () {
    const res = await fetch('./static/insitupdf.json')
    const data = await res.json()
    this.graph = Graph.fromTestJson({
      papers: data.references,
      relations: data.relations
    })
  },

  async searchRefObjs (text, { offset, count }) {
    return _.map(this.graph.nodes, ({ paper }) => paper)
  },

  getRefObj (refObjId) {
    const paper =
      _.find(this.graph.nodes, node => node.paper.id === refObjId).paper
    paper.citings =
      _.map(
        paper.citings,
        ({ id }) =>
          _.find(this.graph.nodes, node => node.paper.id === id).paper)
    return paper
  },

  getRefObjs (refObjIds) {
    return Promise.resolve()
  },

  getReferences (refObjId, { offset, count }) {
    const paper =
      _.find(this.graph.nodes, node => node.paper.id === refObjId).paper
    return _.map(paper.citings, ({ id }) => {
      return _.find(
        this.graph.nodes, node => node.paper.id === id).paper
    })
  },

  getCitedBys (refObjId, { offset, count }) {
    const paper =
      _.find(this.graph.nodes, node => node.paper.id === refObjId).paper
    return _.map(paper.citedBys, ({ id }) => {
      return _.find(
        this.graph.nodes, node => node.paper.id === id).paper
    })
  },

  getCommonRelatives (refObjIds, opt) {
    return _.map(this.graph.nodes, ({ paper }) => paper)
  }
}
