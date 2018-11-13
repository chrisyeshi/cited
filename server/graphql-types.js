let typeDefs = `
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
  authors: [Author]
  references: [Paper]
  citedBys: [Paper]
  getAuthor(paperHashCode: String!): [Author]
  getReferences(paperHashCode: String!): [Paper]
  getCitedBys(paperHashCode: String!): [Paper]
}

type Query {
  getPaper(id: Int): Paper
  searchPaper(text: String): [Paper]
}

schema {
  query: Query
}
`
module.exports = typeDefs