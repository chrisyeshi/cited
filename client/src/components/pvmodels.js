export class Author {
  constructor (surname, given) {
    this.surname = surname
    this.given = given
  }
}

export class Organization {
  constructor (name) {
    this.name = name
  }
}

export class AffiliatedAuthor {
  constructor (surname, given, organization) {
    this.author = new Author(surname, given)
    this.affilation = new Organization(organization)
  }
  get surname () { return this.author.surname }
}

export class Venue {
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

export class Node {
  constructor (article, inGraphReferences, inGraphCitedBys) {
    this.article = article
    this.inGraphReferences = inGraphReferences
    this.inGraphCitedBys = inGraphCitedBys
  }
}

export class Graph {
  constructor (nodes) {
    this.nodes = nodes || []
  }

  get isEmpty () { return this.nodes.length === 0 }
}
