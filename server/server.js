let express = require('express')
let bodyParser = require('body-parser')
let cookieSession = require('cookie-session')
let graphqlHTTP = require('express-graphql')
let schema = require('./graphqlschema.js')
let users = require('./users.js')

// Create an express server and a GraphQL endpoint
let app = express()
app.use(bodyParser.json())
app.use(cookieSession({ secret: 'definitelygoingtochangethis' }))
app.use('/graphql', graphqlHTTP(async (req, res, graphQLParams) => {
  return {
    schema: schema,
    graphiql: true,
    context: {
      user: users.getUserById(req.session.userId)
    }
  }
}))
app.all('/signup', async (req, res) => {
  const user =
    await users.add({ email: req.body.email, password: req.body.password })
  req.session.userId = user.id
  res.send('signed up')
})
app.all('/login', async (req, res) => {
  const user = await users.getUserByEmail(req.body.email)
  if (!user || user.password !== req.body.password) {
    res.send('wrong email or password')
    return
  }
  req.session.userId = user.id
  res.send('logged in')
})
app.all('/logout', (req, res) => {
  req.session.userId = null
  res.send('logged out')
})
app.all('/me', async (req, res) => {
  res.json(await users.getUserById(req.session.userId))
})
app.use('/static', express.static('static'))

app.listen(8000, () => console.log('Express GraphQL Server Now Running On localhost:8000/graphql'));