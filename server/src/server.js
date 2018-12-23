import express from 'express'
import bodyParser from 'body-parser'
import cookieSession from 'cookie-session'
import graphqlHTTP from 'express-graphql'
import schema from './graphqlschema.js'
import users from './users.js'
const exec = require('child_process').exec

// create an express server and a GraphQL endpoint
let app = express()

// middlewares
app.use(bodyParser.json())
app.use(cookieSession({ secret: process.env.COOKIE_SECRET || 'malimalihong' }))
app.use('/graphql', graphqlHTTP(async (req, res, graphQLParams) => {
  return {
    schema: schema,
    graphiql: true,
    context: {
      session: req.session,
      user: users.getUserById(req.session.userId)
    }
  }
}))
app.use('/static', express.static('static'))

app.get('/anystyle', function (req, res) {
  let refTexts = req.query.refs.split('+')
  exec('ruby ruby/AnyStyle.rb ' + refTexts.join(' '), function (err, stdout) {
    if (err) {
      console.error(err)
    }
    res.json(stdout)
  })
})

app.listen(8000, () => console.log('Express GraphQL Server Now Running On localhost:8000/graphql'))
