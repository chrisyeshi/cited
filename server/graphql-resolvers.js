let Database = require('./database')
let db = new Database({})

db.connect()

class Author {
  constructor(id, name) {
    this.id = id
    this.name = name
  }
}

class Venue {
  constructor(id, name) {
    this.id = id
    this.name = name
  }
}

class Paper {
  constructor(data) {
    Object.assign(this, data);
  }

  static fromDatabase(result) {
    let paper = Object.assign({}, result)
    paper.hashCode = result.hexcode
    paper.referenceCount = result.references
    paper.citedByCount = result.citations
    return new Paper(paper)
  }

  getAuthors() {
    return db.getAuthors([this.paperHashCode]).then(
      results => results.map( result => new Author(result) )
    )
  }

  getReferences() {
    return db.getReferences(this.paperHashCode).then(
      results => results.map( result => new Paper(result) )
    )
  }

  getCitedBys() {
    return db.getCitedBys(this.paperHashCode).then(
      results => results.map( result => new Paper(result) )
    )
  }
}

var queryResolvers = {
  getPaper: function ({id}) {
    return db.getPaper(id).then( paperData => Paper.fromDatabase(paperData[0]) )
  },

  searchPaper: function({text}) {
    return db.searchPaperByTitle({text}).then( results => results.map( result => Paper.fromDatabase(result) ) )   
  }
}

let fieldResolvers = {
  Paper: {
    authors(paper) {
      return db.getAuthors(paper.hashCode).then(
        results => results.map( result => new Author(result) )
      )
    },

    references(paper) {
      return db.getReferences(paper.hashCode).then(
        results => results.map( result => Paper.fromDatabase(result) )
      )
    },

    citedBys(paper) {
      return db.getCitedBys(paper.hashCode).then(
        results => results.map( result => Paper.fromDatabase(result) )
      )
    }
  }
}

module.exports = {
  queryResolvers,
  fieldResolvers
}