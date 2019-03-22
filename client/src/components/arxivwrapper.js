import { parseString } from 'xml2js'
import _ from 'lodash'

const baseUrl = 'https://export.arxiv.org/api'
const queryUrl = `${baseUrl}/query`

function buildQueryParaStr (
  { searchQuery, idList, start, maxResults, sortBy, sortOrder }) {
  const searchQueryStr =
    _.isNil(searchQuery) ? '' : `search_query=${searchQuery}`
  const idListStr = _.isNil(idList) ? '' : `id_list=${_.join(idList, ',')}`
  const startStr = _.isNil(start) ? '' : `start=${start}`
  const maxResultsStr = _.isNil(maxResults) ? '' : `max_results=${maxResults}`
  const sortByStr = _.isNil(sortBy) ? '' : `sortBy=${sortBy}`
  const sortOrderStr = _.isNil(sortOrder) ? '' : `sortOrder=${sortOrder}`
  const paraStrArray = [
    searchQueryStr, idListStr, startStr, maxResultsStr, sortByStr, sortOrderStr
  ]
  return _.join(_.filter(paraStrArray, str => str.length > 0), '&')
}

export default async function query (
  { searchQuery, idList, start, maxResults, sortBy }) {
  const queryParaStr =
    buildQueryParaStr({ searchQuery, idList, start, maxResults, sortBy })
  const res = await fetch(`${queryUrl}?${queryParaStr}`)
  if (!res.ok) {
    throw new Error({ code: res.status, text: res.statusText })
  }
  const xml = await res.text()
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) {
        return reject(err)
      }
      return resolve(result)
    })
  })
}
