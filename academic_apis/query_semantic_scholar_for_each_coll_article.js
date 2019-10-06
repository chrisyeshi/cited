import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import query, { fromSemanticScholar } from './semanticscholar.js'

const articles = require(path.join(__dirname, process.argv[2]))

run(articles).then(arts => {
  fs.writeFileSync(process.argv[2], JSON.stringify(arts, null, 2))
})

async function run (articles) {
  const arts = []
  for (let i = 0; i < _.size(articles); ++i) {
    if (!_.isNil(articles[i].references)) {
      arts[i] = articles[i]
      continue
    }
    const duration = Math.floor(Math.random() * 5000) + 1000
    console.log(`waiting ${duration} ms to dodge rate limiting`)
    await sleep(duration)

    const art = articles[i]
    try {
      console.log(`processing ${i + 1}/${_.size(articles)}: ${art.title}`)
      const ssRes = await query(art.externs)
      const ssArt = fromSemanticScholar(ssRes)
      console.log('finished querying semantic scholar')
      arts[i] = ssArt || arts[i]
    } catch (err) {
      console.error(err)
      arts[i] = arts[i]
    }
  }
  return arts
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
