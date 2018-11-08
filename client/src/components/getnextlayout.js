import _ from 'lodash'

export default function (curr, toFrom) {
  const map = {}
  _.forEach(toFrom, (froms, to) => {
    if (_.isArray(froms)) {
      _.forEach(froms, from => {
        map[from] = to
      })
    } else {
      map[froms] = to
    }
  })
  return map[curr] || curr
}
