import _ from 'lodash'

export function fromColl (coll) {
  const collArts = coll.articles
  const hierTagsList = _.map(collArts, collArt => {
    const rawTags = collArt.tags
    const splitTags = _.map(rawTags, tag => _.split(tag, '::'))
    const createTagLevel = splitTag => {
      if (_.isEmpty(splitTag)) {
        return
      }
      const child = createTagLevel(_.tail(splitTag))
      const tag = {
        name: _.head(splitTag),
        artHashes: [ collArt.artHash ]
      }
      return child ? { ...tag, children: { [child.name]: child } } : tag
    }
    const list = _.map(splitTags, createTagLevel)
    return Object.assign({}, ..._.map(list, tag => ({ [tag.name]: tag })))
  })
  const hierTags = _.mergeWith({}, ...hierTagsList, (objVal, srcVal) => {
    if (_.isArray(objVal)) {
      return objVal.concat(srcVal)
    }
  })
  return hierTags
}