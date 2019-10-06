import _ from 'lodash'
import open from 'open'
import path from 'path'

(async function () {
  const arts = require(__dirname + '/' + process.argv[2])
  for (let i = 0; i < arts.length; ++i) {
    const art = arts[i]
    const ssId = art.externs.semanticScholar
    await open(`https://api.semanticscholar.org/${ssId}`)
      .catch(err => console.log(err))
    await sleep(200)
  }
})()

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
