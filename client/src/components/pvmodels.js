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

export class ArticlePool {
  constructor (articles = []) {
    this.articles = articles
  }

  getArticle (articleId) {
    return _.find(this.articles, article => article.id === articleId)
  }

  getCitedBys (refArticleId) {
    return _.filter(this.articles, citedByArticle => {
      return _.includes(citedByArticle.references, refArticleId)
    })
  }

  includes (articleId) {
    return !_.isNil(this.getArticle(articleId))
  }

  setArticle (newArticle) {
    if (_.isNil(newArticle.id)) {
      throw new Error('TODO: assign new article id')
    }
    console.log(this.articles)
    const index =
      _.findIndex(this.articles, article => article.id === newArticle.id)
    console.log(index, newArticle)
    if (index === -1) {
      return new ArticlePool([ ...this.articles, newArticle ])
    } else {
      const oldArticle = this.articles[index]
      return new ArticlePool(
        [ ..._.without(this.articles, oldArticle), newArticle ])
    }
  }
}

export class Graph {
  constructor (nodes) {
    this.nodes = nodes || []
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
