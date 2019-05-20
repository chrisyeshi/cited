import _ from 'lodash'

export class Author {
  constructor (surname, given) {
    this.surname = surname
    this.given = given
  }

  static fromString (text) {
    if (_.includes(', ')) {
      const tokens = _.split(text, ', ')
      const surname = _.first(tokens)
      const given = _.last(tokens)
      return new Author(surname, given)
    }
    const tokens = _.split(text, ' ')
    const surname = _.last(tokens)
    const given = _.first(tokens)
    return new Author(surname, given)
  }
}

export class AffiliatedAuthor {
  constructor (author, organization) {
    this.author = author
    this.affiliation = organization
  }

  static flatten (affiAuthor) {
    return {
      surname: affiAuthor.surname,
      given: affiAuthor.given,
      affiliation: affiAuthor.affiliation.name || undefined
    }
  }

  static fromFlat (flat) {
    if (_.isString(flat)) {
      return new AffiliatedAuthor(Author.fromString(flat), new Organization(''))
    }
    return new AffiliatedAuthor(
      new Author(flat.surname || '', flat.given || ''),
      new Organization(flat.affiliation || ''))
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

  static flatten (srcArt) {
    const art = srcArt.article
    const paper = art.data
    return {
      artId: art.id,
      type: art.type,
      title: paper.title,
      abstract: paper.abstract,
      year: paper.year,
      authors: _.map(paper.authors, author => AffiliatedAuthor.flatten(author)),
      venue: paper.venue,
      nReferences: art.nReferences,
      nCitedBys: art.nCitedBys,
      externs: art.externs
    }
  }

  static fromFlat (flat) {
    return new SourceArticle(
      new Article(
        flat.artId /* id */,
        flat.type /* type */,
        new Paper(
          flat.title /* title */,
          flat.abstract /* abstract */,
          flat.year /* year */,
          _.map(
            flat.authors,
            flatAuthor => AffiliatedAuthor.fromFlat(flatAuthor)) /* authors */,
          flat.venue /* venue */),
        flat.nReferences /* nReferences */,
        [] /* references */,
        flat.nCitedBys /* nCitedBys */,
        flat.externs /* externs */) /* article */,
      {} /* sources */)
  }

  static fromExtern (artId, externSrcArt, refArtIds) {
    return new SourceArticle(
      new Article(
        artId /* id */,
        'paper' /* type */,
        new Paper(
          externSrcArt.data.title /* title */,
          externSrcArt.data.abstract /* abstract */,
          externSrcArt.data.year /* year */,
          externSrcArt.data.authors /* authors */,
          externSrcArt.data.venue /* venue */),
        externSrcArt.nReferences /* nReferences */,
        refArtIds /* references */,
        externSrcArt.nCitedBys /* nCitedBys */,
        externSrcArt.externs /* externs */) /* article */,
      externSrcArt.sources /* sources */)
  }

  static merge (a, b) {
    return _.isNil(a) || _.isNil(b)
      ? a || b
      : new SourceArticle(
        Article.merge(a.article, b.article) /* article */,
        _.mergeWith(
          a.sources,
          b.sources,
          (x, y) => Math.max(x || 0, y || 0)) /* sources */)
  }

  static mergeExtern (srcArt, externSrcArt, refArtIds) {
    return SourceArticle.merge(
      srcArt, SourceArticle.fromExtern(srcArt.id, externSrcArt, refArtIds))
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
