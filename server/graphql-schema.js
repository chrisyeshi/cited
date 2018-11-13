let { buildSchema } = require('graphql');
let Database = require('./database')

let db = new Database({})
db.connect()

// Construct a schema, using GraphQL schema language
let schema = buildSchema(`
  type Author {
    id: String!
    name: String!
  }

  type Venue {
    id: String!
    name: String!
  }

  type Paper {
    id: Int!
    hashCode: String!
    title: String!
    abstract: String
    venue: Venue
    year: Int!
    referenceCount: Int
    citedByCount: Int
    getAuthor(paperHashCode: String!): [Author]
    getReferences(paperHashCode: String!): [Paper]
    getCitedBys(paperHashCode: String!): [Paper]
  }

  type Query {
    getPaper(id: Int): Paper
    searchPaper(text: String): [Paper]
  }
`);

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

let makePaper = function(paperData) {
  let paper = Object.assign({}, paperData)
  paper.hashCode = paperData.hexcode
  paper.referenceCount = paperData.references
  paper.citedByCount = paperData.citedByCount
  return new Paper(paper)
}

// The root provides the top-level API endpoints
var root = {
  getPaper: function ({id}) {
    return db.getPaper(id).then( paperData => makePaper(paperData[0]) )
  },

  searchPaper: function({text}) {
    return db.searchPaperByTitle({text}).then( results => results.map( result => makePaper(result) ) )   
  }
}

module.exports = {
  schema: schema, 
  rootValue: root,
  graphiql: true
}