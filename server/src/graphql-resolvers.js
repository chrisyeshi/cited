import lorumIpsum from 'lorem-ipsum'
import _ from 'lodash'
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
      return db.getAuthors(this.paperHashCode).then(
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
    refObj (obj, { id }) {
      return db.getPaper(id).then(paperData => Paper.fromDatabase(paperData[0]))
    },

    search (obj, { text }) {
      return db.searchPaperByTitle({text}).then(results => results.map(result => Paper.fromDatabase(result)))
    },

    refObjs (obj, { ids }) {
      return Promise.all(_.map(ids, id => {
        return db.getPaper(id)
          .then(paperData => Paper.fromDatabase(paperData[0]))
      }))
    }
  }

  let fieldResolvers = {
    Paper: {
      authors (paper) {
        return db.getAuthors([ paper.hashCode ])
          .then(results => {
            return results.map(result => ({
              id: result.author_id,
              family: result.name,
              given: ''
            }))
          })
          .catch(() => {
            return [ { id: 'authorId', family: 'Unknown', given: 'Author' } ]
          })
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
