import _ from 'lodash'
import {
  AppsyncMyCollectionArticleSource, InMemoryArticleSource
} from './articlesource.js'
import gql from 'graphql-tag'

class InternalVisNode {
  constructor (
    articleId, colRow, inGraphReferenceIds, inGraphCitedByIds,
    inGraphVisReferenceIds, inGraphVisCitedByIds, visStatus) {
    this.articleId = articleId
    this.colRow = colRow
    this.inGraphReferenceIds = inGraphReferenceIds
    this.inGraphCitedByIds = inGraphCitedByIds
    this.inGraphVisReferenceIds = inGraphVisReferenceIds
    this.inGraphVisCitedByIds = inGraphVisCitedByIds
    this.visStatus = visStatus
  }

  get col () { return this.colRow.col }
  get row () { return this.colRow.row }
}

class Link {
  constructor (getReference, getCitedBy) {
    this.getReference = getReference
    this.getCitedBy = getCitedBy
  }

  get reference () { return this.getReference() }

  get citedBy () { return this.getCitedBy() }
}

export class VisGraph {
  constructor (internalVisNodesMap, articleSource) {
    this.internalVisNodesMap = internalVisNodesMap
    this.articleSource = articleSource
  }

  static async fromAppsyncUserCollection (client, userId, collId) {
    const GetUserCollectionArticles = `
      query getUserCollection($userId: ID!, $collId: ID!) {
        getUserCollection(userId: $userId, collId: $collId) {
          userId
          collId
          title
          description
          articles {
            userId
            collId
            artId
            type
            title
            abstract
            year
            authors {
              surname
              given
            }
            venues {
              name
            }
            nReferences
            references {
              articles {
                userId
                collId
                artId
              }
            }
            nCitedBys
            citedBys(limit: 3) {
              articles {
                userId
                collId
                artId
              }
            }
          }
        }
      }
    `
    const result = await client.query({
      query: gql(GetUserCollectionArticles),
      variables: { userId: userId, collId: collId }
    })
    const coll = result.data.getUserCollection
    const artsMap = Object.assign({}, ..._.map(coll.articles, art => ({
      [art.artId]: art
    })))
    const artIds = _.map(coll.articles, art => art.artId)
    const visNodesMap = Object.assign({}, ..._.map(artIds, artId => ({
      [artId]: new InternalVisNode(
        artId /* articleId */,
        { col: null, row: null } /* colRow */,
        [] /* inGraphReferenceIds */,
        [] /* inGraphCitedByIds */,
        [] /* inGraphVisReferenceIds */,
        [] /* inGraphVisCitedByIds */,
        {} /* visStatus */)
    })))
    _.forEach(visNodesMap, (visNode, currArtId) => {
      const allRefArtIds =
        _.map(artsMap[currArtId].references.articles, art => art.artId)
      const refArtIds =
        _.filter(allRefArtIds, refArtId => _.has(visNodesMap, refArtId))
      visNode.inGraphReferenceIds = refArtIds
      _.forEach(refArtIds, refArtId => {
        visNodesMap[refArtId].inGraphCitedByIds =
          _.union(visNodesMap[refArtId].inGraphCitedByIds, [ currArtId ])
      })
    })
    VisGraph.mixinColRows(visNodesMap)
    VisGraph.mixinVisRelations(visNodesMap)
    const artSrc = new AppsyncMyCollectionArticleSource(client, collId)
    return new VisGraph(visNodesMap, artSrc)
  }

  static fromFlatColl (flatColl) {
    const flatArts = flatColl.articles
    const artIds = _.map(flatArts, art => art.artId)
    const visNodesMap = Object.assign({}, ..._.map(artIds, artId => ({
      [artId]: new InternalVisNode(
        artId /* articleId */,
        { col: null, row: null } /* colRow */,
        [] /* inGraphReferenceIds */,
        [] /* inGraphCitedByIds */,
        [] /* inGraphVisReferenceIds */,
        [] /* inGraphVisCitedByIds */,
        {} /* visStatus */)
    })))
    _.forEach(flatColl.relations, relation => {
      visNodesMap[relation.citedById].inGraphReferenceIds =
        _.union(
          visNodesMap[relation.citedById].inGraphReferenceIds,
          [ relation.referenceId ])
      visNodesMap[relation.referenceId].inGraphCitedByIds =
        _.union(
          visNodesMap[relation.referenceId].inGraphCitedByIds,
          [ relation.citedById ])
    })
    VisGraph.mixinColRows(visNodesMap)
    VisGraph.mixinVisRelations(visNodesMap)
    // in memory article source
    const artSrc = InMemoryArticleSource.fromFlatColl(flatColl)
    return new VisGraph(visNodesMap, artSrc)
  }

  static async fromArticleIds (artPool, artIds) {
    // construct visNode holders
    const visNodesMap = Object.assign({}, ..._.map(artIds, artId => ({
      [artId]: new InternalVisNode(
        artId /* articleId */,
        { col: null, row: null } /* colRow */,
        [] /* inGraphReferenceIds */,
        [] /* inGraphCitedByIds */,
        [] /* inGraphVisReferenceIds */,
        [] /* inGraphVisCitedByIds */,
        {} /* visStatus */)
    })))
    // fill in inGraphReferenceIds and inGraphCitedByIds
    await Promise.all(_.map(visNodesMap, async (visNode, currArtId) => {
      const poolRefArtIds = await artPool.getReferenceIds(currArtId)
      const refArtIds =
        _.filter(poolRefArtIds, refArtId => _.has(visNodesMap, refArtId))
      visNode.inGraphReferenceIds = refArtIds
      _.forEach(refArtIds, refArtId => {
        visNodesMap[refArtId].inGraphCitedByIds =
          _.union(visNodesMap[refArtId].inGraphCitedByIds, [ currArtId ])
      })
    }))
    VisGraph.mixinColRows(visNodesMap)
    VisGraph.mixinVisRelations(visNodesMap)
    return new VisGraph(visNodesMap)
  }

  static getAllPathsBetween (
    internalVisNodesMap, refArtId, citedByArtId, path = []) {
    if (refArtId === citedByArtId) {
      return [ path ]
    }
    const refVisNode = internalVisNodesMap[refArtId]
    if (_.isEmpty(refVisNode.inGraphCitedByIds)) {
      return false
    }
    const paths =
      _.concat(
        ..._.map(refVisNode.inGraphCitedByIds, currCitedByArtId => {
          const paths = VisGraph.getAllPathsBetween(
            internalVisNodesMap, currCitedByArtId, citedByArtId,
            [ ...path, { reference: refArtId, citedBy: currCitedByArtId } ])
          return paths
        }))
    return _.filter(paths)
  }

  static getInternalLinks (internalVisNodesMap) {
    return _.flatten(
      _.map(
        internalVisNodesMap,
        (visNode, currArtId) => _.map(
          visNode.inGraphReferenceIds,
          refArtId => ({ reference: refArtId, citedBy: currArtId }))))
  }

  static getInternalVisLinks (internalVisNodesMap) {
    return _.flatten(
      _.map(
        internalVisNodesMap,
        (visNode, currArtId) => _.map(
          visNode.inGraphVisReferenceIds,
          ({ articleId: refArtId, weight }) => ({
            reference: refArtId, citedBy: currArtId, weight
          }))))
  }

  static async insertArticleId (visGraph, artPool, currArtId) {
    if (_.has(visGraph.internalVisNodesMap, currArtId)) {
      return visGraph
    }
    const visNodesMap = _.mapValues(visGraph.internalVisNodesMap, visNode => {
      return new InternalVisNode(
        visNode.articleId /* articleId */,
        { col: null, row: null } /* colRow */,
        visNode.inGraphReferenceIds /* inGraphReferenceIds */,
        visNode.inGraphCitedByIds /* inGraphCitedByIds */,
        [] /* inGraphVisReferenceIds */,
        [] /* inGraphVisCitedByIds */,
        visNode.visStatus /* visStatus */)
    })
    const poolRefArtIds = await artPool.getReferenceIds(currArtId)
    const refArtIds =
      _.filter(
        poolRefArtIds, artId => _.has(visNodesMap, artId))
    const poolCitedByArtIds = await artPool.getCitedByIds(currArtId)
    const citedByArtIds =
      _.filter(
        poolCitedByArtIds, artId => _.has(visNodesMap, artId))
    visNodesMap[currArtId] = new InternalVisNode(
      currArtId /* articleId */,
      { col: null, row: null } /* colRow */,
      refArtIds /* inGraphReferenceIds */,
      citedByArtIds /* inGraphCitedByIds */,
      [] /* inGraphVisReferenceIds */,
      [] /* inGraphVisCitedByIds */,
      {} /* visStatus */)
    _.forEach(refArtIds, refArtId => {
      const visNode = visNodesMap[refArtId]
      visNode.inGraphCitedByIds =
        _.union(visNode.inGraphCitedByIds, [ currArtId ])
    })
    _.forEach(citedByArtIds, citedByArtId => {
      const visNode = visNodesMap[citedByArtId]
      visNode.inGraphReferenceIds =
        _.union(visNode.inGraphReferenceIds, [ currArtId ])
    })
    VisGraph.mixinColRows(visNodesMap)
    VisGraph.mixinVisRelations(visNodesMap)
    return new VisGraph(visNodesMap)
  }

  static mixinColRows (internalVisNodesMap) {
    const colRowsMap = VisGrid.getColRows(internalVisNodesMap)
    _.forEach(colRowsMap, (colRow, artId) => {
      internalVisNodesMap[artId].colRow = colRow
    })
  }

  static mixinVisRelations (internalVisNodesMap) {
    const visConnsMap =
      _.mapValues(
        internalVisNodesMap,
        visNode => ({
          inGraphVisReferencesMap: {}, inGraphVisCitedBysMap: {}
        }))
    const artIdLinks = VisGraph.getInternalLinks(internalVisNodesMap)
    _.forEach(artIdLinks, ({ reference: refArtId, citedBy: citedByArtId }) => {
      const allPaths =
        VisGraph.getAllPathsBetween(
          internalVisNodesMap, refArtId, citedByArtId)
      const maxLength = _.max(_.map(allPaths, path => path.length))
      const paths = _.filter(allPaths, path => path.length === maxLength)
      _.forEach(paths, path => {
        _.forEach(path, idLink => {
          const refArtId = idLink.reference
          const citedByArtId = idLink.citedBy
          visConnsMap[refArtId].inGraphVisCitedBysMap[citedByArtId] =
            visConnsMap[refArtId].inGraphVisCitedBysMap[citedByArtId] ||
            { articleId: citedByArtId, weight: 0 }
          ++visConnsMap[refArtId].inGraphVisCitedBysMap[citedByArtId].weight
          visConnsMap[citedByArtId].inGraphVisReferencesMap[refArtId] =
            visConnsMap[citedByArtId].inGraphVisReferencesMap[refArtId] ||
            { articleId: refArtId, weight: 0 }
          ++visConnsMap[citedByArtId].inGraphVisReferencesMap[refArtId].weight
        })
      })
    })
    _.forEach(visConnsMap, (visConn, artId) => {
      internalVisNodesMap[artId].inGraphVisReferenceIds =
        _.values(visConn.inGraphVisReferencesMap)
      internalVisNodesMap[artId].inGraphVisCitedByIds =
        _.values(visConn.inGraphVisCitedBysMap)
    })
    // sort inGraph connections according to columns and rows
    _.forEach(internalVisNodesMap, visNode => {
      visNode.inGraphVisReferenceIds =
        _.sortBy(visNode.inGraphVisReferenceIds, ({ articleId: refArtId }) => {
          const refVisNode = internalVisNodesMap[refArtId]
          const x = refVisNode.col - visNode.col
          const y = refVisNode.row - visNode.row
          return -y / x
        })
      visNode.inGraphVisCitedByIds =
        _.sortBy(
          visNode.inGraphVisCitedByIds, ({ articleId: citedByArtId }) => {
            const citedByVisNode = internalVisNodesMap[citedByArtId]
            const x = citedByVisNode.col - visNode.col
            const y = citedByVisNode.row - visNode.row
            return y / x
          })
    })
  }

  static setStatus (visGraph, statusesMap) {
    const unchangingVisNodesMap =
      _.omitBy(
        visGraph.internalVisNodesMap,
        (visNode, artId) => _.has(statusesMap, artId))
    const changingVisNodes = _.mapValues(statusesMap, (status, artId) => {
      const visNode = visGraph.internalVisNodesMap[artId]
      return new InternalVisNode(
        artId /* articleId */,
        visNode.colRow /* colRow */,
        visNode.inGraphReferenceIds /* inGraphReferenceIds */,
        visNode.inGraphCitedByIds /* inGraphCitedByIds */,
        visNode.inGraphVisReferenceIds /* inGraphVisReferenceIds */,
        visNode.inGraphVisCitedByIds /* inGraphVisCitedByIds */,
        status /* visStatus */)
    })
    return new VisGraph(
      { ...unchangingVisNodesMap, ...changingVisNodes }, visGraph.articleSource)
  }

  get articleIds () {
    return _.keys(this.internalVisNodesMap)
  }

  getSubVisGraph (subArtIds) {
    const subArtIdsMap = _.keyBy(subArtIds)
    const subInternalVisNodesMap =
      _.mapValues(subArtIdsMap, subArtId => {
        const visNode = this.internalVisNodesMap[subArtId]
        if (!visNode) {
          throw new Error(`article ${subArtId} is not in the graph`)
        }
        const subRefIds =
          _.filter(
            visNode.inGraphReferenceIds, artId => _.has(subArtIdsMap, artId))
        const subCitedByIds =
          _.filter(
            visNode.inGraphCitedByIds, artId => _.has(subArtIdsMap, artId))
        return new InternalVisNode(
          subArtId /* articleId */,
          visNode.colRow /* colRow */,
          subRefIds /* inGraphReferenceIds */,
          subCitedByIds /* inGraphCitedByIds */,
          [] /* inGraphVisReferenceIds */,
          [] /* inGraphVisCitedByIds */,
          {} /* visStatus */)
      })
    VisGraph.mixinVisRelations(subInternalVisNodesMap)
    return new VisGraph(subInternalVisNodesMap)
  }

  getVisNode (artId) {
    const internalVisNode = this.internalVisNodesMap[artId]
    if (!internalVisNode) {
      throw new Error(`article ${artId} is not in the graph`)
    }
    return new VisNode(
      internalVisNode.articleId /* articleId */,
      this.articleSource /* artSrc */,
      internalVisNode.colRow /* colRow */,
      () => _.map(
        internalVisNode.inGraphReferenceIds,
        artId => this.getVisNode(artId)) /* getInGraphReferences */,
      () => _.map(
        internalVisNode.inGraphCitedByIds,
        artId => this.getVisNode(artId)) /* getInGraphCitedBys */,
      () => _.map(
        internalVisNode.inGraphVisReferenceIds,
        ({ articleId, weight }) => ({
          visNode: this.getVisNode(articleId), weight
        })) /* getInGraphVisReferences */,
      () => _.map(
        internalVisNode.inGraphVisCitedByIds,
        ({ articleId, weight }) => ({
          visNode: this.getVisNode(articleId), weight
        })) /* getInGraphVisCitedBys */,
      internalVisNode.visStatus /* visStatus */)
  }

  get grid () {
    const columns = []
    _.forEach(this.internalVisNodesMap, visNode => {
      columns[visNode.col] = columns[visNode.col] || []
      columns[visNode.col][visNode.row] = visNode.articleId
    })
    return columns
  }

  has (artId) { return _.has(this.internalVisNodesMap, artId) }

  get links () {
    const artIdLinks = VisGraph.getInternalLinks(this.internalVisNodesMap)
    return _.map(
      artIdLinks, ({ reference: refArtId, citedBy: citedByArtId }) => {
        return new Link(
          () => this.getVisNode(refArtId), () => this.getVisNode(citedByArtId))
      })
  }

  get visLinks () {
    const artIdVisLinks =
      VisGraph.getInternalVisLinks(this.internalVisNodesMap)
    return _.map(artIdVisLinks, artIdVisLink => {
      return new VisLink(
        artIdVisLink.weight /* weight */,
        () => this.getVisNode(artIdVisLink.reference) /* getReference */,
        () => this.getVisNode(artIdVisLink.citedBy) /* getCitedBy */)
    })
  }

  get visNodes () {
    return _.map(
      this.internalVisNodesMap, visNode => this.getVisNode(visNode.articleId))
  }
}

class VisGrid {
  static getColRows (visNodesMap) {
    const layout = 'balance'
    if (layout === 'skewLeft') {
      const refLevelsMap =
        VisGrid.getNodeLevels(
          visNodesMap, 'inGraphReferenceIds', 'inGraphCitedByIds')
      const sortedArtIdGrid =
        VisGrid.getSortedArticleIdGrid(visNodesMap, refLevelsMap)
      const colRowsMap = {}
      _.forEach(sortedArtIdGrid, (sortedArtIdColumn, iCol) => {
        _.forEach(sortedArtIdColumn, (artId, iRow) => {
          colRowsMap[artId] = { col: iCol, row: iRow }
        })
      })
      return colRowsMap
    }
    if (layout === 'balance') {
      const referenceLevelsMap = VisGrid.getNodeLevels(
        visNodesMap, 'inGraphReferenceIds', 'inGraphCitedByIds')
      const citedByLevelsMap = VisGrid.getNodeLevels(
        visNodesMap, 'inGraphCitedByIds', 'inGraphReferenceIds')
      const maxReferenceLevel = _.max(_.values(referenceLevelsMap)) || 0
      const nCol = maxReferenceLevel + 1
      const colIdxRangesMap = _.mapValues(visNodesMap, (node, artId) => {
        const minColIdx = referenceLevelsMap[artId]
        const maxColIdx = nCol - citedByLevelsMap[artId] - 1
        return { min: minColIdx, max: maxColIdx }
      })
      // sort by column index range
      const artIds = _.keys(visNodesMap)
      const artIdsByColIdxRange = _.sortBy(artIds, artId => {
        const range = colIdxRangesMap[artId].max - colIdxRangesMap[artId].min
        const nInGraphReferences = _.size(visNodesMap[artId].inGraphReferenceIds)
        const nInGraphCitedBys = _.size(visNodesMap[artId].inGraphCitedByIds)
        const nConn = nInGraphReferences + nInGraphCitedBys
        return range * 10000 - nConn
      })
      // use the sorted array as a queue
      const colIdxMap = {}
      const grid = _.map(new Array(nCol), () => [])
      _.forEach(artIdsByColIdxRange, artId => {
        // only one possible column for the article
        if (colIdxRangesMap[artId].max === colIdxRangesMap[artId].min) {
          colIdxMap[artId] = colIdxRangesMap[artId].min
          grid[colIdxRangesMap[artId].min].push(artId)
        } else {
          // get min column index from referencing articles
          const referencingArtIds = visNodesMap[artId].inGraphReferenceIds
          const referencingColIndexes =
            _.map(referencingArtIds, artId => colIdxMap[artId])
          const existingReferencingColIndexes =
            _.filter(referencingColIndexes, v => !_.isNil(v))
          const minColIdx =
            _.max([
              ...existingReferencingColIndexes, colIdxRangesMap[artId].min - 1
            ]) + 1
          const nNeighborReferencingNode =
            _.size(
              _.filter(
                existingReferencingColIndexes,
                colIdx => colIdx === minColIdx - 1))
          // get max column index from cited by articles
          const citedByArtIds = visNodesMap[artId].inGraphCitedByIds
          const citedByColIndexes =
            _.map(citedByArtIds, artId => colIdxMap[artId])
          const existingCitedByColIndexes =
            _.filter(citedByColIndexes, v => !_.isNil(v))
          const maxColIdx =
            _.min([
              ...existingCitedByColIndexes, colIdxRangesMap[artId].max + 1
            ]) - 1
          const nNeighborCitedByNode =
            _.size(
              _.filter(
                existingCitedByColIndexes,
                colIdx => colIdx === maxColIdx + 1))
          // set column index to maximize neighboring paths
          if (nNeighborReferencingNode === 0 && nNeighborCitedByNode === 0) {
            // put into the column with fewest articles
            const cols = _.slice(grid, minColIdx, maxColIdx + 1)
            const nArts = _.map(cols, _.size)
            const colOffset = _.indexOf(nArts, _.min(nArts))
            const colIdx = minColIdx + colOffset
            colIdxMap[artId] = colIdx
            grid[colIdx].push(artId)
          } else if (nNeighborReferencingNode >= nNeighborCitedByNode) {
            colIdxMap[artId] = minColIdx
            grid[minColIdx].push(artId)
          } else {
            colIdxMap[artId] = maxColIdx
            grid[maxColIdx].push(artId)
          }
        }
      })
      // sort rows within columns
      const sortedGrid = _.map(grid, col => {
        return _.sortBy(col, artId => {
          const colIdxRange =
            colIdxRangesMap[artId].max - colIdxRangesMap[artId].min
          const nInGraphCitedBy = _.size(visNodesMap[artId].inGraphCitedByIds)
          return colIdxRange * 10000 + nInGraphCitedBy
        })
      })
      // return colrows map
      const colRowsMap = {}
      _.forEach(sortedGrid, (sortedArtIdColumn, iCol) => {
        _.forEach(sortedArtIdColumn, (artId, iRow) => {
          colRowsMap[artId] = { col: iCol, row: iRow }
        })
      })
      return colRowsMap
    }
    throw new Error('invalid article card layout method')
  }

  static getNodeLevels (visNodesMap, rootProp, connProp) {
    const levelsMap = _.mapValues(visNodesMap, _.constant(0))
    const rootVisNodes =
      _.filter(visNodesMap, visNode => {
        return _.isEmpty(visNode[rootProp])
      })
    const rootArtIds = _.map(rootVisNodes, visNode => visNode.articleId)
    _.forEach(rootArtIds, artId => { levelsMap[artId] = 0 })
    let bfsQueue = [ ...rootArtIds ]
    while (bfsQueue.length > 0) {
      const currArtId = bfsQueue.shift()
      const connArtIds = visNodesMap[currArtId][connProp]
      _.forEach(connArtIds, connArtId => {
        levelsMap[connArtId] =
          levelsMap[connArtId]
            ? Math.max(levelsMap[currArtId] + 1, levelsMap[connArtId])
            : levelsMap[currArtId] + 1
        bfsQueue.push(connArtId)
      })
    }
    return levelsMap
  }

  static getSortedArticleIdGrid (visNodesMap, refLevelsMap) {
    const maxRefLevel = _.max(_.values(refLevelsMap)) || 0
    const grid = _.map(new Array(maxRefLevel + 1), () => [])
    _.forEach(refLevelsMap, (refLevel, artId) => {
      grid[refLevel].push(artId)
    })
    return _.map(grid, unsortedArtIdColumn => {
      return _.sortBy(unsortedArtIdColumn, artId => {
        const visNode = visNodesMap[artId]
        return -visNode.inGraphCitedByIds.length
      })
    })
  }
}

export class VisLink {
  constructor (weight, getReference, getCitedBy, color, opacity) {
    this.weight = weight
    this.getReference = getReference
    this.getCitedBy = getCitedBy
    this.color = color
    this.opacity = opacity
  }

  get reference () { return this.getReference() }
  get referenceId () { return this.reference.articleId }

  get citedBy () { return this.getCitedBy() }
  get citedById () { return this.citedBy.articleId }
}

export class VisNode {
  constructor (
    articleId, artSrc, colRow, getInGraphReferences, getInGraphCitedBys,
    getInGraphVisReferences, getInGraphVisCitedBys, visStatus) {
    this.articleId = articleId
    this.artSrc = artSrc
    this.colRow = colRow
    this.getInGraphReferences = getInGraphReferences
    this.getInGraphCitedBys = getInGraphCitedBys
    this.getInGraphVisReferences = getInGraphVisReferences
    this.getInGraphVisCitedBys = getInGraphVisCitedBys
    this.visStatus = visStatus
  }

  get col () { return this.colRow.col }
  get row () { return this.colRow.row }

  get inGraphReferences () {
    return this.getInGraphReferences()
  }

  get inGraphCitedBys () {
    return this.getInGraphCitedBys()
  }

  get inGraphVisReferences () {
    return this.getInGraphVisReferences()
  }

  get inGraphVisCitedBys () {
    return this.getInGraphVisCitedBys()
  }
}
