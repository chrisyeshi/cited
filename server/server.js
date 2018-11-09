let express = require('express')
let express_graphql = require('express-graphql')
let graphql = require('graphql')
let _ = require('lodash')
let data = require('./static/insitupdf.json')
let { Graph, Node } = require('./graph.js')

let graph = Graph.fromTestJson({
  papers: data.references,
  relations: data.relations
})

let getRefObj = id => _.find(graph.nodes, node => node.paper.id === id).paper

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
    refobj: {
      type: RefObj,
      args: { id: { type: graphql.GraphQLString } },
      resolve: (obj, { id }) => getRefObj(id)
    },
    search: {
      type: new graphql.GraphQLList(RefObj),
      args: { text: { type: graphql.GraphQLString } },
      resolve: (obj, { text }) => _.map(graph.nodes, node => node.paper)
    }
  }
})

let schema = new graphql.GraphQLSchema({ query: Query })

// Create an express server and a GraphQL endpoint
let app = express()
app.use('/graphql', express_graphql({
    schema: schema,
    graphiql: true
}))
app.use('/static', express.static('static'))

app.listen(8000, () => console.log('Express GraphQL Server Now Running On localhost:8000/graphql'));