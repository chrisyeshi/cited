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
        session.user = user
        return user
      },
      async login (obj, { email, password }, { session }, info) {
        const user = await users.getUserByEmail(email)
        if (!user || user.password !== password) {
          return null
        }
        session.user = user
        return user
      },
      logout (obj, args, { session }) {
        const user = session.user
        session.user = null
        return user
      }
    },
    Query: {
      search (obj, { text }, context, info) {
        return _.map(graph.nodes, node => node.paper)
      },
      refObj (obj, { id }, context, info) {
        return getRefObj(id)
      },
      refObjs (obj, { ids }, context, info) {
        return _.map(ids, id => getRefObj(id))
      },
      me (root, args, { session }) {
        return session.user
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
