import _ from 'lodash'

export class Author {
  constructor (surname, given) {
    this.surname = surname
    this.given = given
  }

  static fromString (text) {
    const tokens = _.split(text, ' ')
    const surname = _.last(tokens)
    const given = _.first(tokens)
    return new Author(surname, given)
  }
}

export class AffiliatedAuthor {
  constructor (author, organization) {
    this.author = author
    this.affilation = organization
  }

  static fromName (surname, given, orgName) {
    const author = new Author(surname, given)
    const organization = new Organization(orgName)
    return new AffiliatedAuthor(author, organization)
  }

  static fromString (text) {
    const author = Author.fromString(text)
    const organization = new Organization('')
    return new AffiliatedAuthor(author, organization)
  }

  get given () { return this.author.given }

  get surname () { return this.author.surname }
}

export class Article {
  constructor (
    id, type, data, nReferences, references, nCitedBys, externs) {
    this.id = id
    this.type = type
    this.data = data
    this.nReferences = nReferences
    this.references = references
    this.nCitedBys = nCitedBys
    this.externs = externs || {}
  }

  static merge (a, b) {
    return new Article(
      a.id || b.id /* id */,
      a.type || b.type /* type */,
      new Paper(
        a.data.title || b.data.title /* title */,
        a.data.abstract || b.data.abstract /* abstract */,
        a.data.year || b.data.year /* year */,
        a.data.authors || b.data.authors /* authors */,
        a.data.venue || b.data.venue /* venue */) /* data */,
      _.isNil(a.nReferences) ? b.nReferences : a.nReferences /* nReferences */,
      a.references || b.references /* references */,
      _.isNil(a.nCitedBys) ? b.nCitedBys : a.nCitedBys /* nCitedBys */,
      _.merge(a.externs, b.externs) /* externs */)
  }
}

export class Graph {
  constructor (nodes) {
    this.nodes = nodes || []
  }

  static getAllPathsBetween (reference, citedBy) {
    return Graph.getAllPathsBetweenRecursive(reference, citedBy, [])
  }

  static getAllPathsBetweenRecursive (reference, citedBy, path) {
    if (reference === citedBy) {
      return [ path ]
    }
    if (reference.inGraphCitedBys.length === 0) {
      return false
    }
    const paths =
      _.concat(
        ..._.map(reference.inGraphCitedBys, currCitedBy => {
          const paths = this.getAllPathsBetweenRecursive(
            currCitedBy, citedBy,
            [ ...path, new Link(reference, currCitedBy) ])
          return paths
        }))
    return _.filter(paths)
  }

  static fromArticles (articles) {
    const nodes = _.map(articles, article => new Node(article, [], []))
    _.forEach(nodes, citedByNode => {
      _.forEach(citedByNode.article.references, refId => {
        const refNode = _.find(nodes, refNode => refNode.article.id === refId)
        if (refNode) {
          refNode.inGraphCitedBys.push(citedByNode)
          citedByNode.inGraphReferences.push(refNode)
        }
      })
    })
    return new Graph(nodes)
  }

  static getLinks (nodes) {
    return _.flatten(_.map(nodes, (node, index) => {
      const citedBys = node.inGraphCitedBys
      return _.map(citedBys, citedBy => new Link(node, citedBy))
    }))
  }

  getAllPathsBetween (reference, citedBy) {
    return Graph.getAllPathsBetween(reference, citedBy)
  }

  get isEmpty () { return this.nodes.length === 0 }

  get links () { return Graph.getLinks(this.nodes) }
}

export class Node {
  constructor (article, inGraphReferences, inGraphCitedBys) {
    this.article = article
    this.inGraphReferences = inGraphReferences
    this.inGraphCitedBys = inGraphCitedBys
  }
}

export class Organization {
  constructor (name) {
    this.name = name
  }
}

export class Paper {
  constructor (title, abstract, year, authors, venue) {
    this.title = title
    this.abstract = abstract
    this.year = year
    this.authors = authors
    this.venue = venue
  }
}

export class Link {
  constructor (reference, citedBy) {
    this.reference = reference
    this.citedBy = citedBy
  }
}

export class SourceArticle {
  constructor (article, sources = {}) {
    this.article = article
    this.sources = sources
  }

  static merge (a, b) {
    if (_.isNil(a) || _.isNil(b)) {
      return a || b
    }
    return new SourceArticle(
      Article.merge(a.article, b.article) /* article */,
      _.mergeWith(
        a.sources,
        b.sources,
        (x, y) => Math.max(x || 0, y || 0)) /* sources */)
  }

  get id () {
    return this.article.id
  }
}

export class Venue {
  constructor (name) {
    this.name = name
  }
}

export class VisGraph {
  constructor (visNodes) {
    this.graph = new Graph(visNodes)
  }

  getVisNode (articleId) {
    return _.find(this.visNodes, visNode => visNode.article.id === articleId)
  }

  get grid () {
    const columns = []
    _.forEach(this.visNodes, visNode => {
      columns[visNode.col] = columns[visNode.col] || []
      columns[visNode.col][visNode.row] = visNode
    })
    return columns
  }

  get links () { return this.graph.links }

  get visNodes () { return this.graph.nodes }

  get visLinks () {
    return _.flatten(_.map(this.visNodes, (node, index) => {
      const citedBys = node.inGraphVisCitedBys
      return _.map(
        citedBys, citedBy => new VisLink(node, citedBy.node, citedBy.weight))
    }))
  }

  static fromNodes (nodes) {
    const visNodes = _.map(nodes, node => {
      return new VisNode(
        node /* node */,
        null /* colRow */,
        [] /* inGraphReferences */,
        [] /* inGraphCitedBys */,
        [] /* inGraphVisReferences */,
        [] /* inGraphVisCitedBys */)
    })
    for (let iNode = 0; iNode < visNodes.length; ++iNode) {
      visNodes[iNode].inGraphReferences =
        _.filter(
          _.map(
            visNodes[iNode].node.inGraphReferences,
            node => _.find(visNodes, visNode => visNode.node === node)))
      visNodes[iNode].inGraphCitedBys =
        _.filter(
          _.map(
            visNodes[iNode].node.inGraphCitedBys,
            node => _.find(visNodes, visNode => visNode.node === node)))
    }
    const colRows = VisGrid.getColRows(visNodes)
    _.forEach(_.zip(visNodes, colRows), ([ visNode, colRow ]) => {
      visNode.colRow = colRow
    })
    const visGraph = new VisGraph(visNodes)
    _.forEach(
      visGraph.links, ({ reference: refNode, citedBy: citedByNode }) => {
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
    _.forEach(visNodes, visNode => {
      // sort in-graph connections according to columns and rows
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
    node, colRow, inGraphReferences, inGraphCitedBys, inGraphVisReferences,
    inGraphVisCitedBys) {
    this.node = node
    this.colRow = colRow
    this.inGraphReferences = inGraphReferences
    this.inGraphCitedBys = inGraphCitedBys
    this.inGraphVisReferences = inGraphVisReferences
    this.inGraphVisCitedBys = inGraphVisCitedBys
  }
  get article () { return this.node.article }
  get articleId () { return this.node.article.id }
  get col () { return this.colRow.col }
  get row () { return this.colRow.row }
}
