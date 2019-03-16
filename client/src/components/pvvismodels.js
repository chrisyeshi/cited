import _ from 'lodash'
import { Graph } from './pvmodels.js'

export class VisGraph {
  constructor (visNodes) {
    this.visNodes = visNodes
  }

  static async fromArticleIds (artPool, artIds) {
    // construct visNode holders
    const visNodesMap = Object.assign({}, ..._.map(artIds, artId => ({
      [artId]: new VisNode(
        artId /* articleId */,
        { col: null, row: null } /* colRow */,
        [] /* inGraphReferences */,
        [] /* inGraphCitedBys */,
        [] /* inGraphVisReferences */,
        [] /* inGraphVisCitedBys */)
    })))
    const visNodes = _.values(visNodesMap)
    // fill in inGraphReferences and inGraphCitedBys
    await Promise.all(_.map(visNodes, async visNode => {
      const currArtId = visNode.articleId
      const refArtIds = await artPool.getReferenceIds(currArtId)
      _.forEach(refArtIds, refArtId => {
        const refVisNode = visNodesMap[refArtId]
        const currVisNode = visNodesMap[currArtId]
        if (refVisNode && currVisNode) {
          refVisNode.inGraphCitedBys =
            _.union(refVisNode.inGraphCitedBys, [ currVisNode ])
          currVisNode.inGraphReferences =
            _.union(currVisNode.inGraphReferences, [ refVisNode ])
        }
      })
    }))
    // fill in colRows
    const colRows = VisGrid.getColRows(visNodes)
    _.forEach(_.zip(visNodes, colRows), ([ visNode, colRow ]) => {
      visNode.colRow = colRow
    })
    // fill in inGraphVisReferences and inGraphVisCitedBys
    _.forEach(
      Graph.getLinks(visNodes),
      ({ reference: refNode, citedBy: citedByNode }) => {
        const allPaths = Graph.getAllPathsBetween(refNode, citedByNode)
        const maxLength = _.max(_.map(allPaths, path => path.length))
        const paths = _.filter(allPaths, path => path.length === maxLength)
        _.forEach(paths, path => {
          _.forEach(path, link => {
            const refVisNode =
              _.find(visNodes, visNode => visNode === link.reference)
            const citedByVisNode =
              _.find(visNodes, visNode => visNode === link.citedBy)
            // the citedBys array of the referenced node
            const refConn =
              _.find(
                refVisNode.inGraphVisCitedBys,
                conn => conn.node === citedByVisNode) ||
              { node: citedByVisNode, weight: 0 }
            ++refConn.weight
            refVisNode.inGraphVisCitedBys =
              _.union(refVisNode.inGraphVisCitedBys, [ refConn ])
            // the references array of the cited by node
            const citedByConn =
              _.find(
                citedByVisNode.inGraphVisReferences,
                conn => conn.node === refVisNode) ||
              { node: refVisNode, weight: 0 }
            ++citedByConn.weight
            citedByVisNode.inGraphVisReferences =
              _.union(citedByVisNode.inGraphVisReferences, [ citedByConn ])
          })
        })
      })
    // sort in-graph connections according to columns and rows
    _.forEach(visNodes, visNode => {
      visNode.inGraphVisReferences =
        _.sortBy(visNode.inGraphVisReferences, ({ node: refVisNode }) => {
          const x = refVisNode.col - visNode.col
          const y = refVisNode.row - visNode.row
          return -y / x
        })
      visNode.inGraphVisCitedBys =
        _.sortBy(visNode.inGraphVisCitedBys, ({ node: citedByVisNode }) => {
          const x = citedByVisNode.col - visNode.col
          const y = citedByVisNode.row - visNode.row
          return y / x
        })
    })
    return new VisGraph(visNodes)
  }

  getVisNode (artId) {
    return _.find(this.visNodes, visNode => visNode.articleId === artId)
  }

  get grid () {
    const columns = []
    _.forEach(this.visNodes, visNode => {
      columns[visNode.col] = columns[visNode.col] || []
      columns[visNode.col][visNode.row] = visNode
    })
    return columns
  }

  get links () {
    return Graph.getLinks(this.visNodes)
  }

  get visLinks () {
    return _.flatten(_.map(this.visNodes, (node, index) => {
      const citedBys = node.inGraphVisCitedBys
      return _.map(
        citedBys, citedBy => new VisLink(node, citedBy.node, citedBy.weight))
    }))
  }
}

export class VisGrid {
  static getColRows (nodes) {
    const refLevels =
      VisGrid.getNodeLevels(nodes, 'inGraphReferences', 'inGraphCitedBys')
    const sortedIndexGrid = VisGrid.getSortedIndexGrid(nodes, refLevels)
    const colRows = []
    _.forEach(sortedIndexGrid, (sortedIndexColumn, iCol) => {
      _.forEach(sortedIndexColumn, (index, iRow) => {
        colRows[index] = { col: iCol, row: iRow }
      })
    })
    return colRows
  }

  static getNodeLevels (nodes, rootProp, connProp) {
    let levels = _.times(nodes.length, _.constant(0))
    const rootIndexes = nodes.reduce((paperIndexes, node, paperIndex) => {
      if (node[rootProp].length === 0) {
        paperIndexes.push(paperIndex)
      }
      return paperIndexes
    }, [])
    rootIndexes.forEach(paperIndex => { levels[paperIndex] = 0 })
    let bfsQueue = [].concat(rootIndexes)
    while (bfsQueue.length > 0) {
      const currIndex = bfsQueue.shift()
      const connNodes = nodes[currIndex][connProp]
      const paperIndexes = _.map(connNodes, node => _.findIndex(nodes, node))

      paperIndexes.forEach(paperIndex => {
        levels[paperIndex] = levels[paperIndex] ? Math.max(levels[currIndex] + 1, levels[paperIndex]) : levels[currIndex] + 1
        bfsQueue.push(paperIndex)
      })
    }
    return levels
  }

  static getSortedIndexGrid (nodes, refLevels) {
    const maxRefLevel = _.max(refLevels) || 0
    const grid = _.map(new Array(maxRefLevel + 1), () => ([]))
    for (let index = 0; index < refLevels.length; ++index) {
      const columnIndex = refLevels[index]
      grid[columnIndex].push(index)
    }
    return _.map(grid, unsortedIndexColumn => {
      return _.sortBy(unsortedIndexColumn, index => {
        const node = nodes[index]
        return -node.inGraphCitedBys.length
      })
    })
  }
}

export class VisLink {
  constructor (reference, citedBy, weight, color, opacity) {
    this.reference = reference
    this.citedBy = citedBy
    this.weight = weight
    this.color = color
    this.opacity = opacity
  }
}

export class VisNode {
  constructor (
    articleId, colRow, inGraphReferences, inGraphCitedBys,
    inGraphVisReferences, inGraphVisCitedBys) {
    this.articleId = articleId
    this.colRow = colRow
    this.inGraphReferences = inGraphReferences
    this.inGraphCitedBys = inGraphCitedBys
    this.inGraphVisReferences = inGraphVisReferences
    this.inGraphVisCitedBys = inGraphVisCitedBys
  }
  get col () { return this.colRow.col }
  get row () { return this.colRow.row }
}
