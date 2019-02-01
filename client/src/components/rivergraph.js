import _ from 'lodash'

export class RiverNode {
  constructor (paperId, citedBys, citings) {
    this.paperId = paperId
    this.citedBys =
      _.map(
        citedBys,
        citedBy => ({ paperId: citedBy.paperId, weight: citedBy.weight }))
    this.citings =
      _.map(
        citings,
        citing => ({ paperId: citing.paperId, weight: citing.weight }))
  }
}

export class RiverGraph {
  constructor (nodes) {
    this.nodes = nodes
  }

  static buildFromRelations (graph, relations) {
    const paperIds = getPaperIdsInRelations(relations)
    const riverGraph =
      new RiverGraph(_.map(paperIds, paperId => {
        return new RiverNode(paperId, [], [])
      }))
    _.forEach(relations, ({ citedBy: citedById, citing: citingId }) => {
      const allPaths = graph.getAllPathsBetween(citedById, citingId)
      if (allPaths.length === 0) {
        throw new Error('no path?')
      }
      if (allPaths.length === 1 && allPaths[0].length !== 1) {
        throw new Error(`the graph doesn't have this direct relation?`)
      }
      const inRelationPaths = _.filter(allPaths, path => {
        return includesAll(paperIds, path.paperIds)
      })
      const maxLength = _.max(_.map(inRelationPaths, path => path.length))
      const paths = _.filter(inRelationPaths, path => path.length === maxLength)
      _.forEach(paths, path => {
        _.forEach(path.links, link => {
          riverGraph.incrementEdgeWeight(link)
        })
      })
    })
    return riverGraph
  }

  decrementEdgeWeight (link) {
    const citedByNode = this.getNodeById(link.citedById)
    const citedByLink =
      _.find(citedByNode.citings, citing => citing.paperId === link.citingId)
    --citedByLink.weight
    if (citedByLink.weight === 0) {
      _.pull(citedByNode.citings, citedByLink)
    }

    const citingNode = this.getNodeById(link.citingId)
    const citingLink =
      _.find(citingNode.citedBys, citedBy => citedBy.paperId === link.citedById)
    --citingLink.weight
    if (citingLink.weight === 0) {
      _.pull(citingNode.citedBys, citingLink)
    }
  }

  getNodeById (paperId) {
    return _.find(this.nodes, node => node.paperId === paperId)
  }

  incrementEdgeWeight (link) {
    const citedByNode = this.getNodeById(link.citedById)
    const citedByLink =
      _.find(citedByNode.citings, citing => citing.paperId === link.citingId)
    if (!citedByLink) {
      citedByNode.citings.push({ paperId: link.citingId, weight: 1 })
    } else {
      ++citedByLink.weight
    }
    const citingNode = this.getNodeById(link.citingId)
    const citingLink =
      _.find(citingNode.citedBys, citedBy => citedBy.paperId === link.citedById)
    if (!citingLink) {
      citingNode.citedBys.push({ paperId: link.citedById, weight: 1 })
    } else {
      ++citingLink.weight
    }
  }

  get relations () {
    return _.flatten(_.map(this.nodes, (node, index) => {
      const citings = node.citings
      return _.map(
        citings, citing => ({ citing: citing.paperId, citedBy: node.paperId }))
    }))
  }

  get weightedRelations () {
    return _.flatten(_.map(this.nodes, (node, index) => {
      const citings = node.citings
      return _.map(
        citings, citing => ({
          relation: {
            citing: citing.paperId, citedBy: node.paperId
          },
          weight: citing.weight
        }))
    }))
  }
}

function getPaperIdsInRelations (relations) {
  return _.uniq(
    _.flatten(
      _.map(relations, relation => ([ relation.citedBy, relation.citing ]))))
}

function includesAll (bigArr, smallArr) {
  const includes = _.map(smallArr, value => _.includes(bigArr, value))
  return _.reduce(includes, (result, value) => {
    result = result && value
    return result
  }, true)
}
