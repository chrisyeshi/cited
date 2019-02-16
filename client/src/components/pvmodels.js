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
}

export class Article {
  constructor (type, data, nReferences, references, nCitedBys, citedBys) {
    this.type = type
    this.data = data
    this.nReferences = nReferences
    this.references = references
    this.nCitedBys = nCitedBys
    this.citedBys = citedBys
  }
}

export class Graph {
  constructor (nodes) {
    this.nodes = nodes || []
  }

  getAllPathsBetween (reference, citedBy) {
    return this.getAllPathsBetweenRecursive(reference, citedBy, [])
  }

  getAllPathsBetweenRecursive (reference, citedBy, path) {
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

  get isEmpty () { return this.nodes.length === 0 }

  get links () {
    return _.flatten(_.map(this.nodes, (node, index) => {
      const citedBys = node.inGraphCitedBys
      return _.map(citedBys, citedBy => new Link(node, citedBy))
    }))
  }
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

export class Venue {
  constructor (name) {
    this.name = name
  }
}
