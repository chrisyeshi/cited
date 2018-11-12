let graphql = require('graphql')
let _ = require('lodash')
let data = require('./static/insitupdf.json')
let { Graph, Node } = require('./graph.js')

let graph = Graph.fromTestJson({
  papers: data.references,
  relations: data.relations
})

let getRefObj = id => _.find(graph.nodes, node => node.paper.id === id).paper

// TODO: instead of programmatically build the schema, we can try graphql-tools, which declares schema with a string and inject resolvers

let Author = new graphql.GraphQLObjectType({
  name: 'Author',
  fields: {
    id: { type: graphql.GraphQLString },
    family: { type: graphql.GraphQLString },
    given: { type: graphql.GraphQLString }
  }
})

let Venue = new graphql.GraphQLObjectType({
  name: 'Venue',
  fields: {
    id: { type: graphql.GraphQLString },
    name: { type: graphql.GraphQLString }
  }
})

let RefObj = new graphql.GraphQLObjectType({
  name: 'RefObj',
  fields: () => ({
    id: { type: graphql.GraphQLString },
    title: { type: graphql.GraphQLString },
    authors: { type: new graphql.GraphQLList(Author) },
    abstract: { type: graphql.GraphQLString },
    venue: { type: Venue },
    year: { type: graphql.GraphQLInt },
    referenceCount: { type: graphql.GraphQLInt },
    references: {
      type: new graphql.GraphQLList(RefObj),
      resolve: ({ citings }) => _.map(citings, ({ id }) => getRefObj(id))
    },
    citedByCount: { type: graphql.GraphQLInt },
    citedBys: {
      type: new graphql.GraphQLList(RefObj),
      resolve: ({ citedBys }) => _.map(citedBys, ({ id }) => getRefObj(id))
    },
  })
})

let Query = new graphql.GraphQLObjectType({
  name: 'Query',
  fields: {
    refObj: {
      type: RefObj,
      args: { id: { type: graphql.GraphQLString } },
      resolve: (obj, { id }) => getRefObj(id)
    },
    search: {
      type: new graphql.GraphQLList(RefObj),
      args: { text: { type: graphql.GraphQLString } },
      resolve: (obj, { text }) => _.map(graph.nodes, node => node.paper)
    },
    me: {
      type: graphql.GraphQLString,
      resolve: (obj, args, context) => {
        return context.user.id
      }
    }
  }
})

module.exports =
  new graphql.GraphQLSchema({ query: Query })