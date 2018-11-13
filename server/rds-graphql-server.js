let express = require('express')
let express_graphql = require('express-graphql')
// let graphql_setting = require('./graphql-schema')

let { makeExecutableSchema } = require('graphql-tools')
let graphqlTypes = require('./graphql-types')
let {queryResolvers, fieldResolvers} = require('./graphql-resolvers')

const executableSchema = makeExecutableSchema({
  typeDefs: graphqlTypes,
  resolvers: fieldResolvers
});

let port = process.env.PORT || 8000
let host = process.env.HOST || 'localhost'

// Create an express server and a GraphQL endpoint
let app = express()
app.use('/graphql', express_graphql({
  schema: executableSchema, 
  rootValue: queryResolvers,
  graphiql: true
}))
app.use('/static', express.static('static'))

// console.log(graphql_setting);

app.listen(port, host, 
  () => console.log(`Express GraphQL Server Now Running On ${host}:${port}/graphql`)
);