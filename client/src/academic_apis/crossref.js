import _ from 'lodash'
import https from 'https'

const crossref = 'https://api.crossref.org'
const mailto = 'chrisyeshi@gmail.com'

export default async function query (
  { doi, rowsPerPage, filter, offset, query }) {
  if (!_.isNil(doi)) {
    // DOI available, directly fetch paper
    const url = `${crossref}/works/${doi}?mailto=${mailto}`
    const res = await fetch(url)
    return res.json()
  }
  // search for papers
  const mail = mailto && `mailto=${mailto}`
  const filterStr = filter && `filter=${filter}`
  const rows = rowsPerPage && `rows=${rowsPerPage}`
  const offsetStr = offset && `offset=${offset}`
  const queryStr = query && `query=${query}`
  const params =
    _.join(_.filter([ mail, filterStr, rows, offsetStr, queryStr ]), '&')
  const url = `${crossref}/works?${params}`
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => {
        resolve(JSON.parse(data))
      })
    }).on('error', err => {
      reject(err)
    })
  })
}
