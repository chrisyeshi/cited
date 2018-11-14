import { makeExecutableSchema } from 'graphql-tools'
import resolvers from './testresolvers.js'

const typeDefs = `
  type Query {
    search(text: String!): [RefObj]
    refObj(id: String!): RefObj
  }

  type RefObj {
    id: String!
    title: String
    authors: [Author]
    abstract: String
    venue: Venue
    year: Int
    referenceCount: Int
    references: [RefObj],
    citedByCount: Int
    citedBys: [RefObj]
  }

  type Author {
    id: String!
    family: String
    given: String
  }

  type Venue {
    id: String!
    name: String
  }
`

export default makeExecutableSchema({ typeDefs, resolvers })
