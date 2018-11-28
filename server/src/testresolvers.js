import _ from 'lodash'
import * as data from '../static/insitupdf.json'
import { Graph } from './graph.js'
import users from './users.js'

export default function () {
  let graph = Graph.fromTestJson({
    papers: data.references,
    relations: data.relations
  })

  let getRefObj = id => _.find(graph.nodes, node => node.paper.id === id).paper

  return {
    Mutation: {
      async signUp (obj, { email, password }, { session }, info) {
        const user = await users.add({ email, password })
        session.userId = user.id
        return user
      },
      async login (obj, { email, password }, { session }, info) {
        const user = await users.getUserByEmail(email)
        if (!user || user.password !== password) {
          return null
        }
        session.userId = user.id
        return user
      },
      logout (obj, args, { session }) {
        const user = session.user
        session.userId = null
        return user
      }
    },
    Query: {
      search (obj, { text }, context, info) {
        if (text === '*') {
          return _.map(graph.nodes, ({ paper }) => paper)
        }
        const words = _.words(_.toLower(text))
        const nodes = _.filter(graph.nodes, ({ paper }) => {
          const serialized = _.toLower(JSON.stringify(paper))
          const hasWords = _.map(words, word => _.includes(serialized, word))
          return !_.includes(hasWords, false)
        })
        return _.map(nodes, ({ paper }) => paper)
      },
      refObj (obj, { id }, context, info) {
        return getRefObj(id)
      },
      refObjs (obj, { ids }, context, info) {
        return _.map(ids, id => getRefObj(id))
      },
      me (root, args, { session, user }) {
        return user
      }
    },
    CollectionNode: {
      refObj (collNode, args, context, info) {
        return graph.getNodeById(collNode.refObjId).paper
      }
    },
    RefObj: {
      references (refObj, args, context, info) {
        return _.map(refObj.citings, ({ id }) => getRefObj(id))
      },
      citedBys (refObj, args, context, info) {
        return _.map(refObj.citedBys, ({ id }) => getRefObj(id))
      }
    }
  }
}
