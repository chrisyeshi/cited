import _ from 'lodash'
import fs from 'fs'
import query from './apis.js'

const [ , , ...titleArr ] = process.argv
const title = _.join(titleArr, ' ')
console.log(title)

query(title).then(art => {
  console.log(art)
  if (art) {
    fs.writeFileSync(`${art.artHash}.json`, JSON.stringify(art, null, 2))
  }
})
