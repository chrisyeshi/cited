import _ from 'lodash'
import fs from 'fs'
import query, { fromSemanticScholar } from './semanticscholar.js'
import yargs from 'yargs'

const ids = _.pick(yargs.argv, [ 'doi', 'arxiv', 'semanticScholar' ])

query(ids).then(res => {
  const art = fromSemanticScholar(res)
  if (art.artHash) {
    fs.writeFileSync(`${art.artHash}.json`, JSON.stringify(art, null, 2))
  }
})
