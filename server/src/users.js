import { Graph } from './graph.js'
import * as data from '../static/insitupdf.json'
const fs = require('fs')
const _ = require('lodash')

const graph = Graph.fromTestJson({
  papers: data.references,
  relations: data.relations
})

const committedUsers = [
  {
    id: 'user-1-commit',
    email: 'test@test.com',
    password: 'password',
    collections: [
      {
        id: 'user-1-commit-in-situ-collection',
        title: 'in situ visualization',
        nodes: _.map(graph.nodes, node => ({
          refObjId: node.paper.id,
          inCollectionReferences:
            _.map(node.inGraphCitings, index => graph.nodes[index].paper.id),
          inCollectionCitedBys:
            _.map(node.inGraphCitedBys, index => graph.nodes[index].paper.id)
        }))
      }
    ]
  }
]
const localUsers =
  fs.existsSync('./src/localusers.json')
    ? JSON.parse(fs.readFileSync('./src/localusers.json'))
    : []
const users = () => ([ ...committedUsers, ...localUsers ])

module.exports.getUserById = async id => {
  return _.find(users(), user => user.id === id)
}

module.exports.getUserByEmail = async email => {
  return _.find(users(), user => user.email === email)
}

module.exports.add = async ({ email, password }) => {
  if (_.find(users(), user => user.email === email)) {
    throw new Error('user exists')
  }
  const id = `user-${users().length}-hash06`
  const user = { id: id, email: email, password: password }
  localUsers.push(user)
  fs.writeFile(
    './src/localusers.json',
    JSON.stringify(localUsers, null, 2),
    error => { if (error) throw error })
  return user
}
