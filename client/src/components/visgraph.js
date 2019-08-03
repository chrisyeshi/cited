import _ from 'lodash'

export class ArtGraph {
  constructor (artsMap, adjLists) {
    this.artsMap = artsMap || {}
    this.adjLists = adjLists || {}
  }

  static fromColl (coll) {
    const artsMap =
      Object.assign(
        {}, ..._.map(coll.articles, art => ({ [art.artHash]: art })))
    const adjLists =
      _.mapValues(artsMap, () => ({ references: [], citedBys: [] }))
    _.forEach(coll.relations, relation => {
      adjLists[relation.reference].citedBys.push(relation.citedBy)
      adjLists[relation.citedBy].references.push(relation.reference)
    })
    return new ArtGraph(artsMap, adjLists)
  }

  static fromArts (arts) {
    const artsMap =
      Object.assign(
        {}, ..._.map(arts, art => ({ [art.artHash]: art })))
    const adjLists =
      _.mapValues(artsMap, () => ({ references: [], citedBys: [] }))
    const nodeIds = _.keys(artsMap)
    _.forEach(artsMap, art => {
      const referenceIds = _.map(art.references, reference => {
        return _.isString(reference) ? reference : reference.artHash
      })
      adjLists[art.artHash].references = _.intersection(referenceIds, nodeIds)
      _.forEach(adjLists[art.artHash].references, referenceId => {
        adjLists[referenceId].citedBys.push(art.artHash)
      })
    })
    return new ArtGraph(artsMap, adjLists)
  }

  static async insertArt (graph, art, fetchArt) {
    if (graph.getArt(art.artHash)) {
      return graph
    }
    const arts = await Promise.all(_.map([ ...graph.arts, art ], async art => {
      return _.isNil(art.references) ? fetchArt(art.artHash) : art
    }))
    return ArtGraph.fromArts(arts)
  }

  static extractSubgraph (graph, nodeIds) {
    const artsMap = _.pick(graph.artsMap, nodeIds)
    const adjLists = _.mapValues(_.pick(graph.adjLists, nodeIds), adjList => ({
      references: _.intersection(adjList.references, nodeIds),
      citedBys: _.intersection(adjList.citedBys, nodeIds)
    }))
    return new ArtGraph(artsMap, adjLists)
  }

  get arts () { return _.values(this.artsMap) }

  get nodes () {
    return _.map(this.artsMap, art => this.getNode(art.artHash))
  }

  get nodeIds () {
    return _.keys(this.artsMap)
  }

  get links () {
    const that = this
    return _.flatMap(that.adjLists, (adjList, currId) => {
      return _.map(adjList.references, referenceId => ({
        referenceId: referenceId,
        get reference () { return that.getNode(this.referenceId) },
        citedById: currId,
        get citedBy () { return that.getNode(this.citedById) }
      }))
    })
  }

  getArt (nodeId) {
    return this.artsMap[nodeId]
  }

  getNode (nodeId) {
    const that = this
    const art = that.getArt(nodeId)
    if (!art) {
      throw new Error(`${nodeId} does not exist in graph`)
    }
    return {
      nodeId: art.artHash,
      art: art,
      inGraphReferenceIds: that.getInGraphReferenceIds(nodeId),
      get inGraphReferences () {
        return _.map(
          this.inGraphReferenceIds, referenceId => that.getNode(referenceId))
      },
      inGraphCitedByIds: that.getInGraphCitedByIds(nodeId),
      get inGraphCitedBys () {
        return _.map(
          this.inGraphCitedByIds, citedById => that.getNode(citedById))
      }
    }
  }

  getInGraphReferenceIds (nodeId) {
    return this.adjLists[nodeId].references
  }

  getInGraphCitedByIds (nodeId) {
    return this.adjLists[nodeId].citedBys
  }

  getNodeLevels (rootProp, connProp) {
    const levelsMap = _.mapValues(this.adjLists, _.constant(0))
    const rootIdsMap =
      _.pickBy(this.adjLists, adjList => {
        return _.isEmpty(adjList[rootProp])
      })
    const rootIds = _.keys(rootIdsMap)
    _.forEach(rootIds, nodeId => { levelsMap[nodeId] = 0 })
    let bfsQueue = [ ...rootIds ]
    while (bfsQueue.length > 0) {
      const currNodeId = bfsQueue.shift()
      const connNodeIds = this.adjLists[currNodeId][connProp]
      _.forEach(connNodeIds, connNodeId => {
        levelsMap[connNodeId] = levelsMap[connNodeId]
          ? Math.max(levelsMap[currNodeId] + 1, levelsMap[connNodeId])
          : levelsMap[currNodeId] + 1
        bfsQueue.push(connNodeId)
      })
    }
    return levelsMap
  }

  getNodeInGraphReferenceLevels () {
    return this.getNodeLevels('references', 'citedBys')
  }

  getNodeInGraphCitedByLevels () {
    return this.getNodeLevels('citedBys', 'references')
  }

  getAllPathsBetween (referenceId, citedById, path = []) {
    if (referenceId === citedById) {
      return [ path ]
    }
    if (_.isEmpty(this.getInGraphCitedByIds(referenceId))) {
      return false
    }
    const paths =
      _.concat(
        ..._.map(this.getInGraphCitedByIds(referenceId), currCitedById => {
          const paths = this.getAllPathsBetween(
            currCitedById, citedById,
            [ ...path, { reference: referenceId, citedBy: currCitedById } ])
          return paths
        }))
    return _.filter(paths)
  }
}

export class VisGraph {
  constructor (graph, grid, colRowsMap, adjLists, statsMap) {
    this.graph = graph || new ArtGraph()
    this.grid = grid || []
    this.colRowsMap = colRowsMap || {}
    this.adjLists = adjLists || {}
    this.statsMap = statsMap || {}
  }

  static fromArtGraph (graph) {
    // construct attributes for visualization
    const { grid, colRowsMap } = VisGraph.makeColRowsMap(graph)
    const adjLists = VisGraph.makeAdjLists(graph, colRowsMap)
    const statsMap = _.mapValues(adjLists, () => ({}))
    return new VisGraph(graph, grid, colRowsMap, adjLists, statsMap)
  }

  static fromColl (coll) {
    return VisGraph.fromArtGraph(ArtGraph.fromColl(coll))
  }

  static fromArts (arts) {
    return VisGraph.fromArtGraph(ArtGraph.fromArts(arts))
  }

  static async insertArt (visGraph, art, fetchArt) {
    return VisGraph.fromArtGraph(
      await ArtGraph.insertArt(visGraph.graph, art, fetchArt))
  }

  static extractSubgraph (visGraph, visNodeIds) {
    return VisGraph.fromArtGraph(
      ArtGraph.extractSubgraph(visGraph.graph, visNodeIds))
  }

  static mergeStats (visGraph, statsMap) {
    return new VisGraph(
      visGraph.graph /* graph */,
      visGraph.grid /* grid */,
      visGraph.colRowsMap /* colRowsMap */,
      visGraph.adjLists /* adjLists */,
      _.merge({}, visGraph.statsMap, statsMap) /* statsMap */)
  }

  static makeColRowsMap (graph) {
    const referenceLevelsMap = graph.getNodeInGraphReferenceLevels()
    const citedByLevelsMap = graph.getNodeInGraphCitedByLevels()
    const maxReferenceLevel = _.max(_.values(referenceLevelsMap)) || 0
    const nCol = maxReferenceLevel + 1
    const colIdxRangesMap =
      _.mapValues(graph.adjLists, (adjList, nodeId) => {
        const minColIdx = referenceLevelsMap[nodeId]
        const maxColIdx = nCol - citedByLevelsMap[nodeId] - 1
        return { min: minColIdx, max: maxColIdx }
      })
    // sort by column index range
    const nodeIds = graph.nodeIds
    const nodeIdsByColIdxRange = _.sortBy(nodeIds, nodeId => {
      const range = colIdxRangesMap[nodeId].max - colIdxRangesMap[nodeId].min
      const nInGraphReference = _.size(graph.getInGraphReferenceIds(nodeId))
      const nInGraphCitedBy = _.size(graph.getInGraphCitedByIds(nodeId))
      const nConn = nInGraphReference + nInGraphCitedBy
      return range * 10000 - nConn
    })
    // use the sorted array as a queue
    const colIdxMap = {}
    const grid = _.map(new Array(nCol), () => [])
    _.forEach(nodeIdsByColIdxRange, nodeId => {
      // only one possible column for the node
      if (colIdxRangesMap[nodeId].min === colIdxRangesMap[nodeId].max) {
        colIdxMap[nodeId] = colIdxRangesMap[nodeId].min
        grid[colIdxRangesMap[nodeId].min].push(nodeId)
      } else {
        // get min column index from referencing articles
        const referenceIds = graph.getInGraphReferenceIds(nodeId)
        const referenceColIndexes =
          _.map(referenceIds, nodeId => colIdxMap[nodeId])
        const existingReferenceColIndexes =
          _.filter(referenceColIndexes, v => !_.isNil(v))
        const minColIdx =
          _.max([
            ...existingReferenceColIndexes, colIdxRangesMap[nodeId].min - 1
          ]) + 1
        const nNeighborReferenceNode =
          _.size(
            _.filter(
              existingReferenceColIndexes, colIdx => colIdx === minColIdx - 1))
        // get max column index from citedBy articles
        const citedByIds = graph.getInGraphCitedByIds(nodeId)
        const citedByColIndexes =
          _.map(citedByIds, nodeId => colIdxMap[nodeId])
        const existingCitedByColIndexes =
          _.filter(citedByColIndexes, v => !_.isNil(v))
        const maxColIdx =
          _.min([
            ...existingCitedByColIndexes, colIdxRangesMap[nodeId].max + 1
          ]) - 1
        const nNeighborCitedByNode =
          _.size(
            _.filter(
              existingCitedByColIndexes, colIdx => colIdx === maxColIdx + 1))
        // set column index to maximize neighboring paths
        if (nNeighborReferenceNode === 0 && nNeighborCitedByNode === 0) {
          // put in the column with fewest articles
          const cols = _.slice(grid, minColIdx, maxColIdx + 1)
          const nNodes = _.map(cols, _.size)
          const colOffset = _.indexOf(nNodes, _.min(nNodes))
          const colIdx = minColIdx + colOffset
          colIdxMap[nodeId] = colIdx
          grid[colIdx].push(nodeId)
        } else if (nNeighborReferenceNode >= nNeighborCitedByNode) {
          colIdxMap[nodeId] = minColIdx
          grid[minColIdx].push(nodeId)
        } else {
          colIdxMap[nodeId] = maxColIdx
          grid[maxColIdx].push(nodeId)
        }
      }
    })
    // sort rows within columns
    const sortedGrid = _.map(grid, col => {
      return _.sortBy(col, nodeId => {
        // const colIdxRange =
        //   colIdxRangesMap[nodeId].max - colIdxRangesMap[nodeId].min
        const nInGraphReference = _.size(graph.getInGraphReferenceIds(nodeId))
        const nInGraphCitedBy = _.size(graph.getInGraphCitedByIds(nodeId))
        // return colIdxRange * 10000 - nInGraphCitedBy - nInGraphReference
        return 0 - nInGraphCitedBy - nInGraphReference
      })
    })
    // return colRowsMap
    const colRowsMap = {}
    _.forEach(sortedGrid, (sortedArtIdColumn, iCol) => {
      _.forEach(sortedArtIdColumn, (nodeId, iRow) => {
        colRowsMap[nodeId] = { col: iCol, row: iRow }
      })
    })
    return { grid: sortedGrid, colRowsMap }
  }

  static makeAdjLists (graph, colRowsMap) {
    const visConnsMap = _.mapValues(graph.adjLists, () => ({
      referencesMap: {}, citedBysMap: {}
    }))
    const idLinks = graph.links
    _.forEach(idLinks, ({ referenceId, citedById }) => {
      const allPaths = graph.getAllPathsBetween(referenceId, citedById)
      const maxLength = _.max(_.map(allPaths, path => _.size(path)))
      const paths = _.filter(allPaths, path => _.size(path) === maxLength)
      _.forEach(paths, path => {
        _.forEach(path, ({ reference: referenceId, citedBy: citedById }) => {
          visConnsMap[referenceId].citedBysMap[citedById] =
            visConnsMap[referenceId].citedBysMap[citedById] ||
            { visNodeId: citedById, weight: 0 }
          ++visConnsMap[referenceId].citedBysMap[citedById].weight
          visConnsMap[citedById].referencesMap[referenceId] =
            visConnsMap[citedById].referencesMap[referenceId] ||
            { visNodeId: referenceId, weight: 0 }
          ++visConnsMap[citedById].referencesMap[referenceId].weight
        })
      })
    })
    const adjLists = _.mapValues(visConnsMap, visConn => ({
      references: _.values(visConn.referencesMap),
      citedBys: _.values(visConn.citedBysMap)
    }))
    // sort in-graph connections according to columns and rows
    _.forEach(adjLists, (adjList, currId) => {
      const currColRow = colRowsMap[currId]
      adjList.references =
        _.sortBy(adjList.references, ({ visNodeId: referenceId }) => {
          const referenceColRow = colRowsMap[referenceId]
          const x = referenceColRow.col - currColRow.col
          const y = referenceColRow.row - currColRow.row
          return -y / x
        })
      adjList.citedBys =
        _.sortBy(adjList.citedBys, ({ visNodeId: citedById }) => {
          const citedByColRow = colRowsMap[citedById]
          const x = citedByColRow.col - currColRow.col
          const y = citedByColRow.row - currColRow.row
          return y / x
        })
    })
    return adjLists
  }

  get links () {
    return this.graph.links
  }

  get nodes () {
    return this.graph.nodes
  }

  get visLinks () {
    const that = this
    return _.flatMap(that.adjLists, (adjList, currId) => {
      return _.map(
        adjList.references, ({ visNodeId: referenceId, weight }) => ({
          referenceId: referenceId,
          get reference () { return that.getVisNode(this.referenceId) },
          citedById: currId,
          get citedBy () { return that.getVisNode(this.citedById) },
          weight
        }))
    })
  }

  get visNodes () {
    return _.map(
      this.adjLists, (adjList, visNodeId) => this.getVisNode(visNodeId))
  }

  get visNodeIds () {
    return _.keys(this.adjLists)
  }

  has (nodeId) {
    return !_.isNil(this.adjLists[nodeId])
  }

  getArt (visNodeId) {
    return this.graph.getArt(visNodeId)
  }

  getVisNode (visNodeId) {
    const that = this
    const art = that.getArt(visNodeId)
    if (!art) {
      throw new Error(`${visNodeId} does not exist in vis graph`)
    }
    return {
      visNodeId: visNodeId,
      art: that.getArt(visNodeId),
      colRow: that.colRowsMap[visNodeId],
      get col () { return this.colRow.col },
      get row () { return this.colRow.row },
      inGraphReferenceIds: that.graph.getInGraphReferenceIds(visNodeId),
      get inGraphReferences () {
        return _.map(
          this.inGraphReferenceIds, visNodeId => that.getVisNode(visNodeId))
      },
      inGraphCitedByIds: that.graph.getInGraphCitedByIds(visNodeId),
      get inGraphCitedBys () {
        return _.map(
          this.inGraphCitedByIds, visNodeId => that.getVisNode(visNodeId))
      },
      inGraphVisReferenceIds: that.getInGraphVisReferenceIds(visNodeId),
      get inGraphVisReferences () {
        return _.map(
          this.inGraphVisReferenceIds,
          ({ visNodeId, weight }) => ({
            visNodeId,
            get visNode () { return that.getVisNode(this.visNodeId) },
            weight
          }))
      },
      inGraphVisCitedByIds: that.getInGraphVisCitedByIds(visNodeId),
      get inGraphVisCitedBys () {
        return _.map(
          this.inGraphVisCitedByIds,
          ({ visNodeId, weight }) => ({
            visNodeId,
            get visNode () { return that.getVisNode(this.visNodeId) },
            weight
          }))
      },
      visStatus: that.statsMap[visNodeId]
    }
  }

  getInGraphReferenceIds (visNodeId) {
    return this.graph.getInGraphReferenceIds(visNodeId)
  }

  getInGraphVisReferenceIds (visNodeId) {
    return this.adjLists[visNodeId].references
  }

  getInGraphCitedByIds (visNodeId) {
    return this.graph.getInGraphCitedByIds(visNodeId)
  }

  getInGraphVisCitedByIds (visNodeId) {
    return this.adjLists[visNodeId].citedBys
  }
}
