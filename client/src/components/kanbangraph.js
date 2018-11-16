import _ from 'lodash'
import { Paper } from './paper.js'

const nodeOptTemplate = {
  inGraphCitings: [],
  inGraphCitedBys: [],
  isSelected: false,
  geometry: { height: 0, headerHeight: 0 }
}

export class Relation {
  constructor (citing, citedBy) {
    this.citing = citing
    this.citedBy = citedBy
  }
}

export class Node {
  constructor (paper, nodeOpt = nodeOptTemplate) {
    // TODO: validate the arguments
    this.paper = paper
    const opt = { ...nodeOptTemplate, ...nodeOpt }
    this.inGraphCitings = opt.inGraphCitings
    this.inGraphCitedBys = opt.inGraphCitedBys
    this.geometry = opt.geometry
  }
}

export class Graph {
  constructor (nodes) {
    // TODO: validate the arguments
    this.nodes = nodes
  }

  static fromTestJson ({ papers: testPapers, relations }) {
    const papers =
      _.map(
        testPapers, (testPaper, index) => Paper.fromTestJson(testPaper, index))
    const nodes = _.map(papers, paper => new Node(paper))
    _.forEach(relations, relation => {
      const citingNode = nodes[relation.citing]
      const citedByNode = nodes[relation.citedBy]
      citingNode.inGraphCitedBys =
        _.union(citingNode.inGraphCitedBys, [ citedByNode.paper.id ])
      citedByNode.inGraphCitings =
        _.union(citedByNode.inGraphCitings, [ citingNode.paper.id ])
    })
    _.forEach(nodes, node => {
      node.paper.citings = node.inGraphCitings.slice()
      node.paper.nCitings = node.paper.citings.length
      node.paper.citedBys = node.inGraphCitedBys.slice()
    })
    return new Graph(nodes)
  }

  static fromPapers (papers) {
    const inGraphRelations = this.computeInCollectionRelations(papers)
    const nodes = []
    for (let i = 0; i < papers.length; ++i) {
      const paper = papers[i]
      const inGraphCitings = inGraphRelations[i].citings
      const inGraphCitedBys = inGraphRelations[i].citedBys
      nodes[i] = new Node(paper, {
        inGraphCitings: inGraphCitings,
        inGraphCitedBys: inGraphCitedBys
      })
    }
    return new Graph(nodes)
  }

  static computeInCollectionRelations (papers) {
    return _.map(papers, paper => {
      return this.computeRelationToCollection(paper, papers)
    })
  }

  static computeRelationToCollection (paper, papers) {
    const relation = {
      citings: [],
      citedBys: []
    }
    _.forEach(papers, cPaper => {
      // paper citing cPaper
      if (_.find(paper.references, refObj => refObj.id === cPaper.id)) {
        relation.citings.push(cPaper.id)
      }
      // paper cited by cPaper
      if (_.find(cPaper.references, refObj => refObj.id === paper.id)) {
        relation.citedBys.push(cPaper.id)
      }
    })
    return relation
  }

  insert (paper) {
    if (this.includes(paper)) {
      throw new Error(`cannot insert duplicated paper: ${paper}`)
    }
    const relation = Graph.computeRelationToCollection(
      paper, _.map(this.nodes, node => node.paper))
    _.forEach(relation.citings, refObjId => {
      const node = _.find(this.nodes, node => node.paper.id === refObjId)
      node.inGraphCitedBys.push(paper.id)
    })
    _.forEach(relation.citedBys, refObjId => {
      const node = _.find(this.nodes, node => node.paper.id === refObjId)
      node.inGraphCitings.push(paper.id)
    })
    const node = new Node(paper, {
      inGraphCitings: relation.citings,
      inGraphCitedBys: relation.citedBys
    })
    this.nodes.push(node)
    return node
  }

  includes (arg) {
    const id = arg instanceof Node ? arg.paper.id : arg.id
    return _.includes(this.ids, id)
  }

  get ids () {
    return _.map(this.nodes, node => node.paper.id)
  }

  get dois () {
    return _.map(this.nodes, node => node.paper.doi)
  }

  get isAnyNodeSelected () {
    return this.nodes.find(node => node.isSelected) !== undefined
  }

  get selectedNodes () {
    return this.nodes.filter(node => node.isSelected)
  }

  get relations () {
    return _.flatten(_.map(this.nodes, (node, index) => {
      const citings = node.inGraphCitings
      return _.map(citings, citing => new Relation(citing, index))
    }))
  }

  toggleSelectedByIndex (index) {
    const node = this.nodes[index]
    this.nodes.splice(index, 1, { ...node, isSelected: !node.isSelected })
  }

  toggleSelected (arg) {
    const index = _.isNumber(arg) ? arg : _.indexOf(this.nodes, arg)
    return this.toggleSelectedByIndex(index)
  }

  getUnionRelations (citings, citedBys) {
    return _.filter(this.relations, relation => _.includes(citings, relation.citing) || _.includes(citedBys, relation.citedBy))
  }

  deselectAllNodes () {
    _.forEach(this.nodes, (node, index) => {
      this.nodes.splice(index, 1, { ...node, isSelected: false })
    })
  }

  clear () {
    this.nodes = []
  }

  getNodeById (id) {
    return _.find(this.nodes, node => node.paper.id === id)
  }

  remove (arg) {
    const index = _.isNumber(arg) ? arg : _.indexOf(this.nodes, arg)
    const nodes = this.nodes
    const node = nodes[index]
    _.forEach(node.inGraphCitings, citing => {
      _.pull(this.getNodeById(citing).inGraphCitedBys, node.paper.id)
    })
    _.forEach(node.inGraphCitedBys, citedBy => {
      _.pull(this.getNodeById(citedBy).inGraphCitings, node.paper.id)
    })
    this.nodes.splice(index, 1)
  }
}
