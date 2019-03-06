import _ from 'lodash'

export class Author {
  constructor (surname, given) {
    this.surname = surname
    this.given = given
  }
}

export class AffiliatedAuthor {
  constructor (surname, given, organization) {
    this.author = new Author(surname, given)
    this.affilation = new Organization(organization)
  }
  get surname () { return this.author.surname }
  get given () { return this.author.given }
}

export class Article {
  constructor (id, type, data, nReferences, references, nCitedBys) {
    this.id = id
    this.type = type
    this.data = data
    this.nReferences = nReferences
    this.references = references
    this.nCitedBys = nCitedBys
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

  get id () {
    return this.article.id
  }
}

export class Venue {
  constructor (name) {
    this.name = name
  }
}
