import lorumIpsum from 'lorem-ipsum'
import Database from './database.js'

export default function () {
  let db = new Database({})

  db.connect()

  class Author {
    constructor (id, name) {
      this.id = id
      this.name = name
    }
  }

  class Venue {
    constructor (id, name) {
      this.id = id
      this.name = name
    }
  }

  class Paper {
    constructor (data) {
      Object.assign(this, data)
    }

    static fromDatabase (result) {
      let paper = Object.assign({}, result)
      paper.hashCode = result.hexcode
      paper.referenceCount = result.references
      paper.citedByCount = result.citations
      paper.venue =
        new Venue(paper.conference_id || paper.journal_id, 'workshop')
      paper.abstract = paper.abstract || lorumIpsum({ count: 10 })
      return new Paper(paper)
    }

    getAuthors () {
      return db.getAuthors([ this.paperHashCode ]).then(
        results => results.map(result => new Author(result))
      )
    }

    getReferences () {
      return db.getReferences(this.paperHashCode).then(
        results => results.map(result => new Paper(result))
      )
    }

    getCitedBys () {
      return db.getCitedBys(this.paperHashCode).then(
        results => results.map(result => new Paper(result))
      )
    }
  }

  var queryResolvers = {
    refObj (_, {id}) {
      return db.getPaper(id).then(paperData => Paper.fromDatabase(paperData[0]))
    },

    search (_, {text}) {
      return db.searchPaperByTitle({text}).then(results => results.map(result => Paper.fromDatabase(result)))
    }
  }

  let fieldResolvers = {
    Paper: {
      authors (paper) {
        return db.getAuthors([ paper.hashCode ]).then(
          results => results.map(result => ({
            id: result.author_id,
            family: result.name,
            given: ''
          }))
        )
      },

      references (paper) {
        return db.getReferences(paper.hashCode).then(
          results => results.map(result => Paper.fromDatabase(result))
        )
      },

      citedBys (paper) {
        return db.getCitedBys(paper.hashCode).then(
          results => results.map(result => Paper.fromDatabase(result))
        )
      }
    }
  }

  return {
    Query: queryResolvers,
    RefObj: fieldResolvers.Paper
  }
}
