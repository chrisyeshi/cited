import _ from 'lodash'

export function serializeSampleCollection (coll) {
  const resColl = _.clone(coll)
  delete resColl.userId
  return resColl
}
