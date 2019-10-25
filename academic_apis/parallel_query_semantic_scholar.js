import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import query, { fromSemanticScholar } from './semanticscholar.js'
import createCollection from './createcollection'
import convertArticle from './convertarticle'

const ssId = process.argv[2]
run()

async function run () {
  console.log(`querying ${ssId}`)
  const ssRes = await query({ semanticScholar: ssId })
  const ssArt = fromSemanticScholar(ssRes)
  const ssReferences =
      await Promise.all(_.map(ssArt.references, async reference => {
    const ssRes =
      await query(reference.externs)
    return fromSemanticScholar(ssRes)
  })).catch(err => {
    console.log(err)
  })
  const coll = createCollection(refArts)
  const data = {
    article: convertArticle(ssArt),
    collection: coll
  }
  fs.writeFileSync(process.argv[2], JSON.stringify(data, null, 2))
}
