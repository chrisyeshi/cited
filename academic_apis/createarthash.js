import _ from 'lodash'
import xxhash from 'xxhashjs'

export default function (firstAuthorSurname, year, title) {
  if (_.isNil(firstAuthorSurname) || _.isNil(year) || _.isNil(title)) {
    return null
  }
  const seed = 0xC
  const radix = 16
  const hash =
    xxhash.h64(_.toLower(removeExtraSpaces(title)), seed).toString(radix)
  return `${_.toLower(firstAuthorSurname)}-${year}-${hash}`
}

function removeExtraSpaces (text) {
  return _.trim(_.replace(text, /\s+/g, ' '))
}
