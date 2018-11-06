import { Graph } from './kanbangraph.js'
import _ from 'lodash'

export default {

  graph: new Graph([]),

  initialize () {
    this.initialized = fetch('./static/insitupdf.json')
      .then(res => res.json())
      .then(data => {
        this.graph = Graph.fromTestJson({
          papers: data.references,
          relations: data.relations
        })
      })
  },

  async searchRefObjs (text, { offset, count }) {
    await this.initialized
    return _.map(this.graph.nodes, ({ paper }) => paper)
  },

  async getRefObj (refObjId) {
    await this.initialized
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

  async getReferences (refObjId, { offset, count }) {
    await this.initialized
    const paper =
      _.find(this.graph.nodes, node => node.paper.id === refObjId).paper
    return _.map(paper.citings, ({ id }) => {
      return _.find(
        this.graph.nodes, node => node.paper.id === id).paper
    })
  },

  async getCitedBys (refObjId, { offset, count }) {
    await this.initialized
    const paper =
      _.find(this.graph.nodes, node => node.paper.id === refObjId).paper
    return _.map(paper.citedBys, ({ id }) => {
      return _.find(
        this.graph.nodes, node => node.paper.id === id).paper
    })
  },

  async getCommonRelatives (refObjIds, opt) {
    await this.initialized
    return _.map(this.graph.nodes, ({ paper }) => paper)
  }
}
