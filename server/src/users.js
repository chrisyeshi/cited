const fs = require('fs')
const _ = require('lodash')

const committedUsers = [
  {
    id: 'user-1-commit',
    email: 'test@test.com',
    password: 'password'
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
