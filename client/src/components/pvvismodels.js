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

  static async fromAppsyncMyCollection (client, collId) {
    const GetMyCollectionArticles = `
      query getMyCollection($collId: ID!) {
        getMyCollection(collId: $collId) {
          userId
          collId
          title
          description
          articles {
            artId
            references {
              articles {
                artId
              }
            }
          }
        }
      }
    `
    const result = await client.query({
      query: gql(GetMyCollectionArticles),
      variables: { collId: collId }
    })
    const coll = result.data.getMyCollection
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
