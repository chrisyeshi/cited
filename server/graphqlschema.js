let graphql = require('graphql')
const { makeExecutableSchema } = require('graphql-tools')
let _ = require('lodash')
let data = require('./static/insitupdf.json')
let { Graph, Node } = require('./graph.js')

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

let graph = Graph.fromTestJson({
  papers: data.references,
  relations: data.relations
})

let getRefObj = id => _.find(graph.nodes, node => node.paper.id === id).paper

const resolvers = {
  Query: {
    search(obj, { text }, context, info) {
      return _.map(graph.nodes, node => node.paper)
    },
    refObj(obj, { id }, context, info) {
      return getRefObj(id)
    }
  },
  RefObj: {
    references(refObj, args, context, info) {
      return _.map(refObj.citings, ({ id }) => getRefObj(id))
    },
    citedBys(refObj, args, context, info) {
      return _.map(refObj.citedBys, ({ id }) => getRefObj(id))
    }
  }
}

const schema = makeExecutableSchema({ typeDefs, resolvers })
module.exports = schema