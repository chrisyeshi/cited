let express = require('express')
let express_graphql = require('express-graphql')
let graphql_setting = require('./graphql-schema')

let port = process.env.PORT || 8000
let host = process.env.HOST || 'localhost'

// Create an express server and a GraphQL endpoint
let app = express()
app.use('/graphql', express_graphql(graphql_setting))
app.use('/static', express.static('static'))

// console.log(graphql_setting);

app.listen(port, host, 
  () => console.log(`Express GraphQL Server Now Running On ${host}:${port}/graphql`)
);